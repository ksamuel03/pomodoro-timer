const pomodoroBtn = document.querySelector('.btn-pomodoro');
const breakBtn = document.querySelector('.btn-break');
const startBtn = document.querySelector('.btn-start');
const resetBtn = document.querySelector('.btn-reset');
const minutesSpan = document.querySelector('.minutes');
const secondsSpan = document.querySelector('.seconds');
const todoPopup = document.getElementById('todo-popup');
const todoList = document.getElementById('todo-list');
const todoInput = document.getElementById('todo-input');
const todoAddBtn = document.getElementById('todo-add-btn');
const header = document.getElementById('todo-header');
const alarmSound = document.getElementById('alarm-sound');
const muteBtn = document.getElementById('mute-toggle');

const POMODORO_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

let totalSeconds = POMODORO_DURATION;
let timerRunning = false;
let timerInterval = null;
let currentMode = 'pomodoro'; // default mode
let tasks = []; // array of objects: { text: string, completed: bool }
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let isMuted = false;

function saveTasksToLocalStorage() {
  localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
  const saved = localStorage.getItem('pomodoroTasks');
  if (saved) {
    tasks = JSON.parse(saved);
  }
}

function updateDisplay(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  minutesSpan.textContent = mins < 10 ? '0' + mins : mins;
  secondsSpan.textContent = secs < 10 ? '0' + secs : secs;
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
  }
}

function setTimer(seconds) {
  stopTimer();
  totalSeconds = seconds;
  updateDisplay(totalSeconds);
  startBtn.textContent = 'Start';
}

updateDisplay(totalSeconds);

pomodoroBtn.addEventListener('click', () => {
  currentMode = 'pomodoro';
  setTimer(POMODORO_DURATION);
});

breakBtn.addEventListener('click', () => {
  currentMode = 'break';
  setTimer(BREAK_DURATION);
});

startBtn.addEventListener('click', () => {
  if (!timerRunning) {
    timerInterval = setInterval(() => {
      totalSeconds--;
      if (totalSeconds < 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        startBtn.textContent = 'Start';

        if (alarmSound && !alarmSound.muted) {
          alarmSound.currentTime = 0;
          alarmSound.volume = 1;
          alarmSound.muted = false;
          alarmSound.play().catch(err => {
            console.error('Audio failed to play:', err);
          });
        }

        alert("Time's up!");
        return;
      }
      updateDisplay(totalSeconds);
    }, 1000);
    timerRunning = true;
    startBtn.textContent = 'Pause';
  } else {
    stopTimer();
    startBtn.textContent = 'Start';
  }
});

resetBtn.addEventListener('click', () => {
  if (currentMode === 'pomodoro') {
    setTimer(POMODORO_DURATION);
  } else if (currentMode === 'break') {
    setTimer(BREAK_DURATION);
  }
});

function validateAndSetTime() {
  let mins = parseInt(minutesSpan.textContent);
  let secs = parseInt(secondsSpan.textContent);

  if (isNaN(mins) || mins < 0) mins = 0;
  if (isNaN(secs) || secs < 0) secs = 0;
  if (secs > 59) secs = 59;
  if (mins > 180) mins = 180;

  minutesSpan.textContent = mins < 10 ? '0' + mins : mins;
  secondsSpan.textContent = secs < 10 ? '0' + secs : secs;

  totalSeconds = mins * 60 + secs;
  stopTimer();
  startBtn.textContent = 'Start';
}

minutesSpan.addEventListener('blur', validateAndSetTime);
secondsSpan.addEventListener('blur', validateAndSetTime);

function handleKeyDown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.target.blur();
  }
}
minutesSpan.addEventListener('keydown', handleKeyDown);
secondsSpan.addEventListener('keydown', handleKeyDown);

function renderTasks() {
  todoList.innerHTML = '';
  tasks.forEach((taskObj, index) => {
    const li = document.createElement('li');
    if (taskObj.completed) li.classList.add('completed');

    const taskText = document.createElement('span');
    taskText.textContent = taskObj.text;
    li.appendChild(taskText);

    const completeBtn = document.createElement('button');
    const checkImg = document.createElement('img');
    checkImg.src = './images/checkmark.png';
    checkImg.alt = 'Complete';
    checkImg.style.width = '16px';
    checkImg.style.height = '16px';
    completeBtn.appendChild(checkImg);
    completeBtn.title = 'Complete task';
    completeBtn.style.marginLeft = 'auto';
    completeBtn.style.cursor = 'pointer';
    completeBtn.style.background = 'none';
    completeBtn.style.border = 'none';
    completeBtn.onclick = () => {
      tasks[index].completed = !tasks[index].completed;
      saveTasksToLocalStorage();
      renderTasks();
    };
    li.appendChild(completeBtn);

    const delBtn = document.createElement('button');
    const delImg = document.createElement('img');
    delImg.src = './images/delete.png';
    delImg.alt = 'Delete';
    delImg.style.width = '16px';
    delImg.style.height = '16px';
    delBtn.appendChild(delImg);
    delBtn.title = 'Delete task';
    delBtn.style.cursor = 'pointer';
    delBtn.style.background = 'none';
    delBtn.style.border = 'none';
    delBtn.onclick = () => {
      tasks.splice(index, 1);
      saveTasksToLocalStorage();
      renderTasks();
    };
    li.appendChild(delBtn);

    todoList.appendChild(li);
  });
}

todoAddBtn.addEventListener('click', () => {
  const newTask = todoInput.value.trim();
  if (newTask) {
    tasks.push({ text: newTask, completed: false });
    todoInput.value = '';
    saveTasksToLocalStorage();
    renderTasks();
  }
});

todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    todoAddBtn.click();
  }
});

header.addEventListener('mousedown', (e) => {
  isDragging = true;
  const rect = todoPopup.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  header.style.cursor = 'grabbing';
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  header.style.cursor = 'grab';
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    todoPopup.style.left = (e.clientX - dragOffsetX) + 'px';
    todoPopup.style.top = (e.clientY - dragOffsetY) + 'px';
  }
});

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  alarmSound.muted = isMuted;
  muteBtn.textContent = isMuted ? '🔇' : '🔊';
});

// Load saved tasks when page starts
loadTasksFromLocalStorage();
renderTasks();
