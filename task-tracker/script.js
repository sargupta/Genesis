// **DO NOT use import statements here if you are loading Firebase SDKs via <script> tags in index.html**
// The firebase object will be available globally from those script tags.

document.addEventListener('DOMContentLoaded', () => {
    // --- START: Firebase Configuration ---
    // IMPORTANT: Replace with your project's Firebase config object
    // You get this from the Firebase console.

    const firebaseConfig = {
        apiKey: "AIzaSyCzD03lInCUpK30VdL7lfr3gKGH1Vzf1To",
        authDomain: "tasktracker4all.firebaseapp.com",
        projectId: "tasktracker4all",
        storageBucket: "tasktracker4all.firebasestorage.app",
        messagingSenderId: "327523133822",
        appId: "1:327523133822:web:c22f8bca454deb4989ab2f",
        measurementId: "G-QF40ML993Q"
    };

    // Initialize Firebase (using the global 'firebase' object from the compat SDKs)
    if (!firebase.apps.length) {
        console.log("Initializing Firebase with compat libraries...");
        firebase.initializeApp(firebaseConfig);
    } else {
        console.log("Firebase (compat) already initialized.");
        firebase.app(); // if already initialized, use that one
    }

    // Initialize Firestore using the compat library style
    const db = firebase.firestore();
    if (!db) {
        console.error("FATAL ERROR: Firestore (db) instance is not available. Check Firebase SDKs in HTML and initialization.");
        alert("Error initializing database. App cannot function. Check console.");
        return; // Stop further execution if db is not initialized
    }
    const tasksCollection = db.collection('tasks'); // Using a collection named 'tasks'
    console.log("Firestore 'tasks' collection reference created.");
    // --- END: Firebase Configuration ---


    const newTaskInput = document.getElementById('newTaskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const tasksContainers = document.querySelectorAll('.tasks-container');

    let draggedTaskElement = null; // Holds the HTML element being dragged
    let localTasksCache = { // A local cache to make UI updates feel instant (though Firestore handles the truth)
        todo: [],
        inprogress: [],
        done: []
    };


    // --- Task Creation ---
    addTaskBtn.addEventListener('click', async () => {
        console.log("Add Task button clicked!");
        const taskText = newTaskInput.value.trim();
        if (taskText) {
            const newTaskData = { // Renamed to avoid confusion with HTML element
                text: taskText,
                column: 'todo', // Default column
                createdAt: firebase.firestore.FieldValue.serverTimestamp() // For ordering
            };
            console.log("Attempting to add task to Firestore:", newTaskData);
            try {
                const docRef = await tasksCollection.add(newTaskData);
                console.log("Task added to Firestore with ID:", docRef.id);
                newTaskInput.value = '';
                // UI update will be handled by the Firestore onSnapshot listener
            } catch (error) {
                console.error("Detailed Firestore Error adding task: ", error);
                alert("Error adding task. Please try again. Check console for details.");
            }
        } else {
            console.log("Task text is empty, not adding.");
        }
    });

    function createTaskElement(taskData) { // taskData includes id from Firestore
        const taskDiv = document.createElement('div');
        taskDiv.classList.add('task', 'mdc-card');
        taskDiv.setAttribute('draggable', true);
        taskDiv.setAttribute('id', taskData.id); // Firestore document ID
        taskDiv.setAttribute('data-column', taskData.column);

        const taskTextSpan = document.createElement('span');
        taskTextSpan.classList.add('task-text');
        taskTextSpan.textContent = taskData.text;
        taskDiv.appendChild(taskTextSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-task-btn', 'material-icons');
        deleteBtn.textContent = 'delete_outline';
        deleteBtn.title = 'Delete task';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            console.log("Delete button clicked for task ID:", taskData.id);
            try {
                await tasksCollection.doc(taskData.id).delete();
                console.log("Task deleted from Firestore:", taskData.id);
                // UI update by onSnapshot listener
            } catch (error) {
                console.error("Detailed Firestore Error deleting task: ", error);
                alert("Error deleting task. Please try again. Check console.");
            }
        });
        taskDiv.appendChild(deleteBtn);

        taskDiv.addEventListener('dragstart', (e) => {
            console.log("Drag started for task:", taskData.id);
            draggedTaskElement = e.target;
            e.dataTransfer.setData('text/plain', taskData.id);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => {
                if (e.target) e.target.style.opacity = '0.5';
            }, 0);
        });

        taskDiv.addEventListener('dragend', (e) => {
            console.log("Drag ended for task:", taskData.id);
            if (draggedTaskElement) {
                 draggedTaskElement.style.opacity = '1';
            }
            draggedTaskElement = null;
            tasksContainers.forEach(c => c.classList.remove('drag-over'));
        });
        return taskDiv;
    }

    // --- Rendering Tasks ---

    function updateTaskCounts(tasksByColumn) {
    for (const columnId in tasksByColumn) {
        if (tasksByColumn.hasOwnProperty(columnId)) {
            const countElement = document.querySelector(`.task-count[data-count-for="${columnId}"]`);
            if (countElement) {
                countElement.textContent = tasksByColumn[columnId].length;
            }
        }
    }
}

// Modify your existing renderTasks function
function renderTasks(tasksByColumn) {
    console.log("Rendering tasks from cache:", tasksByColumn);
    tasksContainers.forEach(container => {
        container.innerHTML = '';
    });

    for (const columnId in tasksByColumn) {
        if (tasksByColumn.hasOwnProperty(columnId)) {
            const columnElement = document.querySelector(`.tasks-container[data-column-id="${columnId}"]`);
            if (columnElement) {
                const sortedTasks = tasksByColumn[columnId].sort((a, b) => {
                    // ... (your existing sorting logic) ...
                    if (a.createdAt && b.createdAt && a.createdAt.seconds && b.createdAt.seconds) {
                        return a.createdAt.seconds - b.createdAt.seconds;
                    } else if (a.createdAt && b.createdAt) {
                        return a.createdAt - b.createdAt;
                    }
                    return 0;
                });

                sortedTasks.forEach(taskData => {
                    const taskElement = createTaskElement(taskData);
                    columnElement.appendChild(taskElement);
                });
            } else {
                console.warn(`Column container for ${columnId} not found.`);
            }
        }
    }
    updateTaskCounts(tasksByColumn); // <--- ADD THIS LINE HERE
}


    // --- Drag and Drop for Columns (Task Containers) ---
    tasksContainers.forEach(container => {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            container.classList.add('drag-over');
        });

        container.addEventListener('dragleave', (e) => {
            container.classList.remove('drag-over');
        });

        container.addEventListener('drop', async (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            const targetColumnId = container.dataset.columnId;
            const taskId = e.dataTransfer.getData('text/plain');

            console.log(`Drop event: taskId='${taskId}', targetColumnId='${targetColumnId}'`);

            if (draggedTaskElement && taskId) {
                const originalColumnId = draggedTaskElement.dataset.column;
                console.log(`Original column: '${originalColumnId}'`);
                if (originalColumnId !== targetColumnId) {
                    console.log(`Attempting to update task '${taskId}' column to '${targetColumnId}' in Firestore.`);
                    try {
                        await tasksCollection.doc(taskId).update({ column: targetColumnId });
                        console.log(`Task '${taskId}' column updated in Firestore.`);
                        if (targetColumnId === 'done') {
                            triggerConfetti();
                        }
                        // UI update by onSnapshot listener
                    } catch (error) {
                        console.error("Detailed Firestore Error updating task column: ", error);
                        alert("Error moving task. Please try again. Check console.");
                    }
                } else {
                    console.log("Task dropped in the same column, no Firestore update needed.");
                }
            } else {
                console.log("Drop event occurred but draggedTaskElement or taskId is missing.");
            }
            // draggedTaskElement is reset in dragend
        });
    });


    // --- Firestore Real-time Listener ---
    console.log("Setting up Firestore onSnapshot listener...");
    tasksCollection.orderBy('createdAt', 'asc').onSnapshot(snapshot => {
        console.log("Firestore snapshot received. Processing documents...");
        localTasksCache = { todo: [], inprogress: [], done: [] };
        snapshot.forEach(doc => {
            const taskData = { ...doc.data(), id: doc.id };
            // console.log("Processing task from snapshot:", taskData);
            if (localTasksCache[taskData.column]) {
                localTasksCache[taskData.column].push(taskData);
            } else {
                console.warn(`Task with id ${taskData.id} has unknown column '${taskData.column}'. Placing in 'todo'.`);
                taskData.column = 'todo';
                localTasksCache.todo.push(taskData);
            }
        });
        renderTasks(localTasksCache);
        console.log("Finished processing snapshot and re-rendered tasks.");
    }, error => {
        console.error("Detailed Firestore Error onSnapshot: ", error);
        alert("Could not load tasks or listen for updates. Check console for errors.");
    });

    // --- Confetti ---
    function triggerConfetti() {
        if (typeof confetti !== 'function') {
            console.warn('Confetti library not loaded.');
            return;
        }
        console.log("Triggering confetti!");
        const duration = 2 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1050 };

        function randomInRange(min, max) { return Math.random() * (max - min) + min; }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }

    console.log("DOMContent Loaded. App initialized. Waiting for Firestore data or user interaction.");
    // No need for explicit initial loadTasks() or renderTasks() here,
    // as the onSnapshot listener will fetch and render initial data.
});