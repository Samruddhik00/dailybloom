const HABIT_STORAGE_KEY = 'dailyBloom_habits';
const TODO_STORAGE_KEY = 'dailyBloom_todos';
const COMPLETED_STORAGE_KEY = 'dailyBloom_completed';
const MOOD_STORAGE_KEY = 'dailyBloom_moods';

let habits = JSON.parse(localStorage.getItem(HABIT_STORAGE_KEY)) || [];
let todos = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)) || [];
let completed = JSON.parse(localStorage.getItem(COMPLETED_STORAGE_KEY)) || {};
let moods = JSON.parse(localStorage.getItem(MOOD_STORAGE_KEY)) || {};

let currentViewDate = new Date().toISOString().split('T')[0]; // Today by default

function renderHabits(viewDate) {
  const habitList = document.getElementById('habitList');
  habitList.innerHTML = '';
  
  const isToday = viewDate === new Date().toISOString().split('T')[0];
  const dayCompleted = completed[viewDate] || {};
  const dayMoods = moods[viewDate] || [];

  habits.forEach((habit, index) => {
    const div = document.createElement('div');
    div.className = 'habit-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!dayCompleted[index];
    
    if (isToday) {
      checkbox.onchange = () => toggleHabit(index, viewDate);
    } else {
      checkbox.disabled = true; // Read-only for past days
    }

    const label = document.createElement('label');
    label.textContent = habit;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'btn small';
    removeBtn.style.marginLeft = '1rem';
    removeBtn.onclick = () => removeHabit(index);

    div.appendChild(checkbox);
    div.appendChild(label);
    if (isToday) div.appendChild(removeBtn); // Only show remove on today
    habitList.appendChild(div);
  });

  // Update moods for the viewed date
  const moodCheckboxes = document.querySelectorAll('#moods input[type="checkbox"]');
  moodCheckboxes.forEach(cb => {
    cb.checked = dayMoods.includes(cb.value);
    cb.disabled = !isToday;
    if (isToday) {
      cb.onchange = saveMood;
    }
  });
}

function addHabit() {
  const name = prompt('Enter new habit name:');
  if (name && name.trim()) {
    habits.push(name.trim());
    saveHabits();
    renderHabits(currentViewDate);
    updateProgress();
  }
}

function removeHabit(index) {
  if (confirm('Remove this habit permanently? (From all history)')) {
    habits.splice(index, 1);
    // Clean up completed data
    Object.keys(completed).forEach(date => {
      delete completed[date][index];
      // Re-index higher ones if needed, but simpler to just delete
    });
    saveHabits();
    saveCompleted();
    renderHabits(currentViewDate);
    updateProgress();
  }
}

function toggleHabit(index, date) {
  if (!completed[date]) completed[date] = {};
  completed[date][index] = !completed[date][index];
  saveCompleted();
  updateProgress();
}

function saveHabits() {
  localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
}

function saveCompleted() {
  localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(completed));
}

function saveMood() {
  const checkboxes = document.querySelectorAll('#moods input[type="checkbox"]');
  const selected = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  moods[currentViewDate] = selected;
  localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(moods));
}

// To-do functions remain the same (current only)
function renderTodos() {
  const todoList = document.getElementById('todoList');
  todoList.innerHTML = '';
  todos.forEach((todo, index) => {
    const li = document.createElement('li');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.onchange = () => removeTodo(index);

    const span = document.createElement('span');
    span.textContent = todo;

    li.appendChild(checkbox);
    li.appendChild(span);
    todoList.appendChild(li);
  });
}

function addTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();
  if (text) {
    todos.push(text);
    input.value = '';
    saveTodos();
    renderTodos();
  }
}

function removeTodo(index) {
  todos.splice(index, 1);
  saveTodos();
  renderTodos();
}

function saveTodos() {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
}

function updateProgress() {
  // Same as before...
  const progressDiv = document.getElementById('progressBars');
  progressDiv.innerHTML = '<h3>Habit Completion (Last 30 Days)</h3>';

  const today = new Date();
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  habits.forEach((habit, habitIndex) => {
    const habitDiv = document.createElement('div');
    habitDiv.innerHTML = `<strong>${habit}</strong>`;

    const bar = document.createElement('div');
    bar.className = 'progress-bar';

    let completedCount = 0;
    dates.forEach(date => {
      if (completed[date] && completed[date][habitIndex]) completedCount++;
    });

    const percentage = habits.length > 0 ? (completedCount / 30) * 100 : 0;

    const fill = document.createElement('div');
    fill.className = 'progress-bar-fill';
    fill.style.width = `${percentage}%`;

    bar.appendChild(fill);
    habitDiv.appendChild(bar);
    progressDiv.appendChild(habitDiv);
  });

  if (habits.length > 0) {
    const overallDiv = document.createElement('div');
    overallDiv.innerHTML = '<strong>Overall Habit Completion (Last 30 Days)</strong>';

    const overallBar = document.createElement('div');
    overallBar.className = 'progress-bar';

    let totalCompleted = 0;
    let totalPossible = habits.length * 30;

    dates.forEach(date => {
      if (completed[date]) {
        Object.values(completed[date]).forEach(done => {
          if (done) totalCompleted++;
        });
      }
    });

    const overallPercentage = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;

    const overallFill = document.createElement('div');
    overallFill.className = 'progress-bar-fill';
    overallFill.style.width = `${overallPercentage}%`;

    overallBar.appendChild(overallFill);
    overallDiv.appendChild(overallBar);
    progressDiv.appendChild(overallDiv);
  }
}

// New: Add date picker to habits section
const habitsSection = document.querySelector('#habits');
const datePickerHTML = `
  <div style="margin: 1rem 0; text-align: center;">
    <label for="viewDate"><strong>View Day:</strong> </label>
    <input type="date" id="viewDate" />
    <button id="todayBtn" class="btn small" style="margin-left: 0.5rem;">Today</button>
  </div>
`;
habitsSection.insertAdjacentHTML('afterbegin', datePickerHTML);

// Event listeners
document.getElementById('addHabitBtn').addEventListener('click', addHabit);

document.getElementById('addTodoBtn').addEventListener('click', addTodo);
document.getElementById('todoInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') addTodo();
});

document.getElementById('viewDate').addEventListener('change', (e) => {
  currentViewDate = e.target.value;
  if (currentViewDate) {
    renderHabits(currentViewDate);
  }
});

document.getElementById('todayBtn').addEventListener('click', () => {
  currentViewDate = new Date().toISOString().split('T')[0];
  document.getElementById('viewDate').value = currentViewDate;
  renderHabits(currentViewDate);
});

// Initial setup
const today = new Date().toISOString().split('T')[0];
document.getElementById('viewDate').value = today;
document.getElementById('viewDate').max = today; // Can't pick future dates

renderHabits(today);
renderTodos();
updateProgress();