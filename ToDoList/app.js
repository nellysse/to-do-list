const todoForm = document.querySelector('form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
// Получаем контейнер подсказок из HTML
const suggestionsBox = document.getElementById('suggestions-container'); 

// Популярные слова для подсказок, если ввод пуст
const popularWords = ["работа", "дом", "покупки", "звонок", "отчет", "встреча"];

// 1. Инициализация: Загружаем задачи при старте
let allTodos = getTodos();
updateTodoList();

// Обработка формы (добавление задачи)
todoForm.addEventListener('submit', function(event) {
    event.preventDefault();
    addTodo();
});

// Обработчик для подсказок: Запускает поиск при вводе
todoInput.addEventListener("input", () => {
    loadSuggestions(todoInput.value.trim());
});

// ЕДИНЫЙ ОБРАБОТЧИК СОБЫТИЙ (Делегирование: Удаление и Чекбоксы)
todoList.addEventListener('click', function(event) {
    const todoItem = event.target.closest('li');

    if (!todoItem) return;

    const todoIndex = Array.from(todoList.children).indexOf(todoItem);

    if (todoIndex > -1) {
        if (event.target.closest('.delete-button')) {
            // УДАЛЕНИЕ
            deleteTodoItem(todoIndex);
        } else if (event.target.type === 'checkbox') {
            // ЧЕКБОКС
            toggleTodoCompleted(todoIndex);
        }
    }
});

// --- Функции API (Подсказки) ---

async function loadSuggestions(query = "") {
    suggestionsBox.innerHTML = '';
    const MAX_SUGGESTIONS = 5;

    let suggestions = [];

    if (!query) {
        // Если поле ввода пустое, показываем популярные слова
        suggestions = popularWords.slice(0, MAX_SUGGESTIONS).map(word => ({ word }));
    } else {
        try {
            // Вызов Datamuse API для получения подсказок
            const response = await fetch(`https://api.datamuse.com/sug?s=${query}&max=${MAX_SUGGESTIONS}`);
            suggestions = await response.json();
        } catch(err) {
            console.error("Ошибка загрузки подсказок Datamuse API:", err);
            suggestionsBox.style.display = 'none';
            return;
        }
    }

    if (suggestions.length === 0) {
        suggestionsBox.style.display = 'none';
        return;
    }

    // Показываем контейнер и заполняем его
    suggestionsBox.style.display = 'block';

    suggestions.forEach(s => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = s.word;

        div.onclick = () => {
            // При клике на подсказку, вставляем текст и добавляем задачу
            todoInput.value = s.word;
            addTodo(); 
            suggestionsBox.innerHTML = '';
        };

        suggestionsBox.appendChild(div);
    });
}

// --- Функции CRUD (Создание, Чтение, Обновление, Удаление) ---

function addTodo() {
    const todoText = todoInput.value.trim();
    if (todoText.length > 0) {
        const todoObject = { text: todoText,
            completed: false 
        };
        allTodos.push(todoObject);
        updateTodoList();
        saveTodos(); 
        todoInput.value = '';
        suggestionsBox.innerHTML = ''; // Очищаем подсказки после добавления
    }
}

function deleteTodoItem(todoIndex) {
    allTodos = allTodos.filter((_, index) => index !== todoIndex);
    saveTodos();
    updateTodoList();
}

function toggleTodoCompleted(todoIndex) {
    allTodos[todoIndex].completed = !allTodos[todoIndex].completed;
    saveTodos();
    updateTodoList();
}


function updateTodoList() {
    todoList.innerHTML = '';
    allTodos.forEach((todo, todoIndex) => {
        const todoItem = createTodoItem(todo, todoIndex);
        todoList.append(todoItem);
    });
}

function createTodoItem(todo, todoIndex) {
    const todoID = "todo-" + todoIndex;
    const todoLI = document.createElement('li');
    todoLI.className = `todo ${todo.completed ? 'completed' : ''}`;
    
    // Внутренний HTML-код элемента задачи
    todoLI.innerHTML = `
        <input type="checkbox" id="${todoID}" ${todo.completed ? 'checked' : ''}>
        <label class="custom-checkbox" for="${todoID}">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" 
                viewBox="0 -960 960 960" width="24px" fill="#1C1D20">
                <path d="M382-240 154-468l57-57 171 171 
                    367-367 57 57-424 424Z"/>
            </svg>
        </label>
        <label for="${todoID}" class="todo-text">${todo.text}</label>
        <button class="delete-button">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" 
                viewBox="0 -960 960 960" width="24px" fill="#4A4D57">
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520
                    q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 
                    0h80v-360h-80v360ZM280-720v520-520Z"/>
            </svg>
        </button>
    `;
    return todoLI;
}

// --- Функции Local Storage ---

function saveTodos() {
    const todosJson = JSON.stringify(allTodos); 
    localStorage.setItem("todos", todosJson);
}

function getTodos() {
    const todos = localStorage.getItem("todos") || "[]";
    return JSON.parse(todos);
}