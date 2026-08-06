// ==========================================
// Notes App - script.js
// This file handles all the logic for the Notes App
// ==========================================

// Array that will hold all our notes
let notes = [];

// This variable keeps track of which note is being edited
// It stays "null" when we are adding a new note (not editing)
let editingNoteId = null;

// ==========================================
// Get references to HTML elements
// (Doing this once at the top makes the code cleaner)
// ==========================================
const titleInputEl = document.getElementById("titleInput");
const contentInputEl = document.getElementById("contentInput");
const charCountEl = document.getElementById("charCount");
const notesGridEl = document.getElementById("notesGrid");
const emptyStateEl = document.getElementById("emptyState");
const searchInputEl = document.getElementById("searchInput");
const formHeadingEl = document.getElementById("formHeading");
const saveBtnEl = document.getElementById("saveBtn");
const cancelEditBtnEl = document.getElementById("cancelEditBtn");

// ==========================================
// Load notes from Local Storage when the page starts
// ==========================================
function loadNotes() {
    // getItem returns a string, so we need to convert it back to an array using JSON.parse
    const storedNotes = localStorage.getItem("notes");

    if (storedNotes) {
        notes = JSON.parse(storedNotes);
    } else {
        notes = [];
    }

    renderNotes();
}

// ==========================================
// Save the notes array into Local Storage
// ==========================================
function saveToLocalStorage() {
    // localStorage can only store strings, so we convert our array to a string
    localStorage.setItem("notes", JSON.stringify(notes));
}

// ==========================================
// Generate a simple unique ID for each note
// (Using the current timestamp is enough for a student project)
// ==========================================
function generateId() {
    return Date.now().toString();
}

// ==========================================
// Get the current date and time in a readable format
// ==========================================
function getCurrentDateTime() {
    const now = new Date();

    const day = now.getDate().toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear();

    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // handle midnight (0 hours)

    return day + "/" + month + "/" + year + " - " + hours + ":" + minutes + " " + ampm;
}

// ==========================================
// Update the character counter as the user types
// ==========================================
contentInputEl.addEventListener("input", function () {
    const currentLength = contentInputEl.value.length;
    charCountEl.textContent = currentLength + " / 300 characters";
});

// ==========================================
// Keyboard shortcut: Ctrl + Enter saves the note
// ==========================================
document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "Enter") {
        saveNote();
    }
});

// ==========================================
// Save Note function
// Handles BOTH adding a new note and updating an existing one
// ==========================================
function saveNote() {
    const title = titleInputEl.value.trim();
    const content = contentInputEl.value.trim();

    // Simple validation - don't allow empty notes
    if (title === "" && content === "") {
        alert("Please write something before saving the note.");
        return;
    }

    if (editingNoteId === null) {
        // ----- Adding a brand new note -----
        const newNote = {
            id: generateId(),
            title: title === "" ? "Untitled Note" : title,
            content: content,
            pinned: false,
            date: getCurrentDateTime()
        };

        // Add the new note to the beginning of the array
        notes.unshift(newNote);

    } else {
        // ----- Updating an existing note -----
        const noteToEdit = notes.find(function (note) {
            return note.id === editingNoteId;
        });

        if (noteToEdit) {
            noteToEdit.title = title === "" ? "Untitled Note" : title;
            noteToEdit.content = content;
            noteToEdit.date = getCurrentDateTime() + " (edited)";
        }

        // Reset editing state back to normal "add" mode
        editingNoteId = null;
        formHeadingEl.textContent = "Add a New Note";
        saveBtnEl.textContent = "Save Note";
        cancelEditBtnEl.style.display = "none";
    }

    saveToLocalStorage();
    clearForm();
    renderNotes();
}

// ==========================================
// Clear the input fields after saving
// ==========================================
function clearForm() {
    titleInputEl.value = "";
    contentInputEl.value = "";
    charCountEl.textContent = "0 / 300 characters";
}

// ==========================================
// Cancel editing and go back to "Add Note" mode
// ==========================================
function cancelEdit() {
    editingNoteId = null;
    formHeadingEl.textContent = "Add a New Note";
    saveBtnEl.textContent = "Save Note";
    cancelEditBtnEl.style.display = "none";
    clearForm();
}

// ==========================================
// Start editing a note (fills the form with existing data)
// ==========================================
function editNote(id) {
    const note = notes.find(function (note) {
        return note.id === id;
    });

    if (!note) return;

    // Fill the form with the note's current data
    titleInputEl.value = note.title;
    contentInputEl.value = note.content;
    charCountEl.textContent = note.content.length + " / 300 characters";

    // Switch the form into "editing" mode
    editingNoteId = id;
    formHeadingEl.textContent = "Edit Note";
    saveBtnEl.textContent = "Update Note";
    cancelEditBtnEl.style.display = "inline-block";

    // Scroll up to the form so the user can see it
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================================
// Delete a note (with confirmation)
// ==========================================
function deleteNote(id) {
    const confirmDelete = confirm("Are you sure you want to delete this note?");

    if (confirmDelete) {
        notes = notes.filter(function (note) {
            return note.id !== id;
        });

        saveToLocalStorage();
        renderNotes();
    }
}

// ==========================================
// Pin or Unpin a note
// ==========================================
function togglePin(id) {
    const note = notes.find(function (note) {
        return note.id === id;
    });

    if (note) {
        note.pinned = !note.pinned;
        saveToLocalStorage();
        renderNotes();
    }
}

// ==========================================
// Render all notes on the screen
// This function also handles searching and sorting (pinned notes first)
// ==========================================
function renderNotes() {
    const searchTerm = searchInputEl.value.toLowerCase();

    // Filter notes based on the search term (checks title and content)
    let filteredNotes = notes.filter(function (note) {
        return (
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm)
        );
    });

    // Sort notes so pinned notes always appear first
    filteredNotes.sort(function (a, b) {
        return b.pinned - a.pinned; // true (1) comes before false (0)
    });

    // Show empty state if there are no notes to display
    if (filteredNotes.length === 0) {
        emptyStateEl.style.display = "block";
        notesGridEl.innerHTML = "";
        return;
    } else {
        emptyStateEl.style.display = "none";
    }

    // Clear the grid before re-drawing it
    notesGridEl.innerHTML = "";

    // Create a card for each note
    filteredNotes.forEach(function (note) {
        const card = document.createElement("div");
        card.className = "note-card" + (note.pinned ? " pinned" : "");

        card.innerHTML = `
            <div>
                <h3 class="note-title">${escapeHtml(note.title)}</h3>
                <p class="note-content">${escapeHtml(note.content)}</p>
                <p class="note-date">${note.date}</p>
            </div>
            <div class="note-actions">
                <button class="pin-btn" onclick="togglePin('${note.id}')">
                    ${note.pinned ? "Unpin" : "Pin"}
                </button>
                <button class="edit-btn" onclick="editNote('${note.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteNote('${note.id}')">Delete</button>
            </div>
        `;

        notesGridEl.appendChild(card);
    });
}

// ==========================================
// Small helper function to prevent HTML injection
// when displaying note title/content typed by the user
// ==========================================
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// Run this when the page first loads
// ==========================================
loadNotes();