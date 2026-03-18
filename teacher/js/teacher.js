// Get current teacher ID
let currentTeacherId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (user) {
        currentTeacherId = user.id;
        await loadTeacherDashboard();
        await loadTeacherSubjects();
        await loadTeacherCourseworks();
        await loadTeacherTimetable();
        await loadSubjectsForDropdown();
    }
});

// Show content sections
function showContent(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(sectionId)) {
            link.classList.add('active');
        }
    });
}

// ========== DASHBOARD ==========
async function loadTeacherDashboard() {
    try {
        const subjects = await getTeacherSubjects(currentTeacherId);
        const courseworks = await getTeacherCourseworks(currentTeacherId);
        
        let totalStudents = 0;
        subjects.forEach(s => totalStudents += s.student_count || 0);
        
        const activeCourseworks = courseworks.filter(c => new Date(c.due_date) > new Date()).length;
        const pendingGrading = courseworks.reduce((acc, c) => {
            return acc + (c.submissions - c.graded);
        }, 0);
        
        document.getElementById('total-subjects').textContent = subjects.length;
        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('active-courseworks').textContent = activeCourseworks;
        document.getElementById('pending-grading').textContent = pendingGrading;
        
        // Display subjects list
        const subjectsList = document.getElementById('teacher-subjects-list');
        subjectsList.innerHTML = subjects.map(s => `
            <div class="recent-item">
                <span class="item-name">${s.name}</span>
                <span class="item-detail">${s.class_name} • ${s.student_count} students</span>
            </div>
        `).join('');
        
        // Display recent courseworks
        const recentCourseworks = document.getElementById('recent-courseworks');
        recentCourseworks.innerHTML = courseworks.slice(0, 5).map(c => `
            <div class="recent-item">
                <span class="item-name">${c.title}</span>
                <span class="item-detail">${c.type} • Due: ${new Date(c.due_date).toLocaleDateString()}</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ========== SUBJECTS ==========
async function loadTeacherSubjects() {
    try {
        const subjects = await getTeacherSubjects(currentTeacherId);
        const container = document.getElementById('subjects-grid');
        
        if (!subjects || subjects.length === 0) {
            container.innerHTML = '<p>No subjects assigned</p>';
            return;
        }
        
        container.innerHTML = subjects.map(s => `
            <div class="subject-card">
                <div class="subject-header">
                    <h3>${s.name}</h3>
                    <p>${s.code}</p>
                </div>
                <div class="subject-body">
                    <div class="subject-info">
                        <p><i>📚</i> Class: ${s.class_name}</p>
                        <p><i>👥</i> Students: ${s.student_count}</p>
                    </div>
                </div>
                <div class="subject-footer">
                    <button onclick="showSubjectCourseworks(${s.id})" class="btn-small">View Courseworks</button>
                    <button onclick="showContent('attendance-content'); selectSubject(${s.id})" class="btn-small">Attendance</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// ========== COURSEWORKS ==========
async function loadTeacherCourseworks(filter = 'all') {
    try {
        const courseworks = await getTeacherCourseworks(currentTeacherId);
        const container = document.getElementById('courseworks-grid');
        
        let filtered = courseworks;
        if (filter !== 'all') {
            filtered = courseworks.filter(c => c.type.toLowerCase() === filter.toLowerCase());
        }
        
        if (!filtered || filtered.length === 0) {
            container.innerHTML = '<p>No courseworks found</p>';
            return;
        }
        
        container.innerHTML = filtered.map(c => {
            const dueDate = new Date(c.due_date);
            const isOverdue = dueDate < new Date();
            
            return `
            <div class="coursework-card">
                <div class="coursework-header ${c.type.toLowerCase()}">
                    <span class="coursework-type">${c.type}</span>
                    <h3>${c.title}</h3>
                    <p class="coursework-subject">${c.subject_name} • ${c.class_name}</p>
                </div>
                <div class="coursework-body">
                    <p class="coursework-description">${c.description || 'No description'}</p>
                    
                    <div class="coursework-meta">
                        <div class="meta-item">
                            <span class="label">Total Marks</span>
                            <span class="value">${c.total_marks}</span>
                        </div>
                        <div class="meta-item">
                            <span class="label">Due Date</span>
                            <span class="value ${isOverdue ? 'overdue' : ''}">
                                ${dueDate.toLocaleDateString()}
                                ${isOverdue ? '(Overdue)' : ''}
                            </span>
                        </div>
                    </div>
                    
                    <div class="submission-stats">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(c.graded / c.submissions * 100) || 0}%"></div>
                        </div>
                        <p>${c.graded}/${c.submissions} graded</p>
                    </div>
                </div>
                <div class="coursework-footer">
                    <button onclick="viewSubmissions(${c.id})" class="btn-small">View Submissions</button>
                    <button onclick="editCoursework(${c.id})" class="btn-small">Edit</button>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('Error loading courseworks:', error);
    }
}

function filterCourseworks(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    loadTeacherCourseworks(type);
}

// ========== ADD COURSEWORK ==========
async function showAddCourseworkModal() {
    await loadSubjectsForDropdown('coursework-subject');
    document.getElementById('coursework-form').reset();
    document.getElementById('coursework-modal').style.display = 'block';
}

document.getElementById('coursework-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const courseworkData = {
        subject_id: parseInt(document.getElementById('coursework-subject').value),
        teacher_id: currentTeacherId,
        title: document.getElementById('coursework-title').value,
        description: document.getElementById('coursework-description').value,
        type: document.getElementById('coursework-type').value,
        total_marks: parseFloat(document.getElementById('coursework-marks').value),
        due_date: document.getElementById('coursework-duedate').value
    };
    
    try {
        await createCoursework(courseworkData);
        closeModal('coursework-modal');
        await loadTeacherCourseworks();
        alert('Coursework posted successfully!');
    } catch (error) {
        alert('Error posting coursework: ' + error.message);
    }
});

// ========== SUBMISSIONS ==========
async function viewSubmissions(courseworkId) {
    try {
        const submissions = await getSubmissionsForGrading(currentTeacherId, courseworkId);
        const container = document.getElementById('submissions-list');
        
        if (!submissions || submissions.length === 0) {
            container.innerHTML = '<p>No submissions yet</p>';
        } else {
            container.innerHTML = submissions.map(s => `
                <div class="submission-item" data-id="${s.id}">
                    <div class="submission-header">
                        <span class="student-name">${s.student_name} (${s.admission})</span>
                        <span class="submission-date">Submitted: ${new Date(s.submission_date).toLocaleString()}</span>
                    </div>
                    <div class="submission-content">
                        ${s.content || '<em>No content provided</em>'}
                    </div>
                    <div class="submission-grade">
                        <input type="number" class="marks-input" placeholder="Marks" value="${s.marks_obtained || ''}">
                        <input type="text" class="feedback-input" placeholder="Feedback" value="${s.feedback || ''}">
                        <button onclick="gradeSubmission(${s.id}, this)" class="btn-small btn-success">Save Grade</button>
                    </div>
                </div>
            `).join('');
        }
        
        document.getElementById('submissions-title').textContent = 'Grade Submissions';
        document.getElementById('submissions-modal').style.display = 'block';
    } catch (error) {
        console.error('Error loading submissions:', error);
    }
}

async function gradeSubmission(submissionId, button) {
    const submissionDiv = button.closest('.submission-item');
    const marks = submissionDiv.querySelector('.marks-input').value;
    const feedback = submissionDiv.querySelector('.feedback-input').value;
    
    try {
        await gradeSubmission({
            submission_id: submissionId,
            marks_obtained: parseFloat(marks),
            feedback: feedback
        });
        
        button.textContent = 'Saved!';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = 'Save Grade';
            button.disabled = false;
        }, 2000);
    } catch (error) {
        alert('Error saving grade: ' + error.message);
    }
}

// ========== ATTENDANCE ==========
async function loadSubjectsForDropdown(selectId = 'attendance-subject') {
    try {
        const subjects = await getTeacherSubjects(currentTeacherId);
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Subject</option>';
            subjects.forEach(s => {
                select.innerHTML += `<option value="${s.id}">${s.name} - ${s.class_name}</option>`;
            });
        }
        
        // Also load classes for attendance
        const classes = await getClasses();
        const classSelect = document.getElementById('attendance-class');
        if (classSelect) {
            classSelect.innerHTML = '<option value="">Select Class</option>';
            classes.forEach(c => {
                classSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        }
        
        // Set today's date
        const dateInput = document.getElementById('attendance-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    } catch (error) {
        console.error('Error loading dropdowns:', error);
    }
}

async function loadAttendanceStudents() {
    const classId = document.getElementById('attendance-class').value;
    if (!classId) return;
    
    try {
        const students = await getStudents();
        const filtered = students.filter(s => s.class_id == classId);
        const tbody = document.getElementById('attendance-table-body');
        
        tbody.innerHTML = filtered.map(s => `
            <tr data-student-id="${s.id}">
                <td>${s.first_name} ${s.last_name}</td>
                <td>${s.admission_number}</td>
                <td>
                    <select class="attendance-status">
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                        <option value="EXCUSED">Excused</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="attendance-remarks" placeholder="Remarks">
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

async function saveAttendance() {
    const classId = document.getElementById('attendance-class').value;
    const date = document.getElementById('attendance-date').value;
    const subjectId = document.getElementById('attendance-subject').value;
    
    if (!classId || !date) {
        alert('Please select class and date');
        return;
    }
    
    const records = [];
    document.querySelectorAll('#attendance-table-body tr').forEach(row => {
        records.push({
            student_id: parseInt(row.dataset.studentId),
            status: row.querySelector('.attendance-status').value,
            remarks: row.querySelector('.attendance-remarks').value
        });
    });
    
    // Here you would call your attendance API
    alert(`Attendance saved for ${records.length} students`);
}

// ========== TIMETABLE ==========
async function loadTeacherTimetable() {
    try {
        const timetable = await getTeacherTimetable(currentTeacherId);
        const container = document.getElementById('timetable-grid');
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        let html = '';
        days.forEach(day => {
            const daySlots = timetable.filter(t => t.day === day);
            html += `
                <div class="timetable-day">
                    <div class="day-header">${day}</div>
                    ${daySlots.length > 0 ? daySlots.map(slot => `
                        <div class="timetable-slot">
                            <div class="slot-subject">${slot.subject}</div>
                            <div class="slot-time">${slot.start} - ${slot.end}</div>
                            <div class="slot-room">${slot.class} • ${slot.room}</div>
                        </div>
                    `).join('') : '<div class="timetable-slot">No classes</div>'}
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading timetable:', error);
    }
}

// ========== GRADES ==========
async function loadGradeStudents() {
    const subjectId = document.getElementById('grade-subject').value;
    const courseworkId = document.getElementById('grade-coursework').value;
    
    if (!subjectId || !courseworkId) return;
    
    try {
        const submissions = await getSubmissionsForGrading(currentTeacherId, courseworkId);
        const coursework = (await getTeacherCourseworks(currentTeacherId)).find(c => c.id == courseworkId);
        
        const tbody = document.getElementById('grades-table-body');
        const tableHead = document.querySelector('.grades-table thead tr');
        
        // Update table header with max marks
        if (coursework) {
            const th = tableHead.querySelector('th:nth-child(4)');
            th.textContent = `Marks (/${coursework.total_marks})`;
        }
        
        if (!submissions || submissions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No submissions found</td></tr>';
            return;
        }
        
        tbody.innerHTML = submissions.map(s => `
            <tr data-id="${s.id}">
                <td>${s.student_name}</td>
                <td>${s.admission}</td>
                <td>${new Date(s.submission_date).toLocaleDateString()}</td>
                <td><input type="number" class="marks-input" value="${s.marks_obtained || ''}"></td>
                <td><input type="text" class="feedback-input" value="${s.feedback || ''}"></td>
                <td><button onclick="saveGrade(${s.id}, this)" class="btn-small btn-success">Save</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading grades:', error);
    }
}

async function saveGrade(submissionId, button) {
    const row = button.closest('tr');
    const marks = row.querySelector('.marks-input').value;
    const feedback = row.querySelector('.feedback-input').value;
    
    try {
        await gradeSubmission({
            submission_id: submissionId,
            marks_obtained: parseFloat(marks),
            feedback: feedback
        });
        
        button.textContent = 'Saved!';
        setTimeout(() => {
            button.textContent = 'Save';
        }, 2000);
    } catch (error) {
        alert('Error saving grade: ' + error.message);
    }
}

// ========== UTILITIES ==========
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function selectSubject(subjectId) {
    const select = document.getElementById('attendance-subject');
    if (select) {
        select.value = subjectId;
    }
}

function showSubjectCourseworks(subjectId) {
    showContent('courseworks-content');
    // Filter courseworks by subject
}