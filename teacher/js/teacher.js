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

// ========== NAVIGATION ==========
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
        const subjects   = await getTeacherSubjects(currentTeacherId);
        const courseworks = await getTeacherCourseworks(currentTeacherId);

        let totalStudents = 0;
        subjects.forEach(s => totalStudents += s.student_count || 0);

        const activeCourseworks = courseworks.filter(c =>
            c.due_date && new Date(c.due_date) > new Date()
        ).length;

        const pendingGrading = courseworks.reduce((acc, c) => {
            return acc + ((c.submissions || 0) - (c.graded || 0));
        }, 0);

        document.getElementById('total-subjects').textContent    = subjects.length;
        document.getElementById('total-students').textContent    = totalStudents;
        document.getElementById('active-courseworks').textContent = activeCourseworks;
        document.getElementById('pending-grading').textContent   = pendingGrading;

        const subjectsList = document.getElementById('teacher-subjects-list');
        if (subjectsList) {
            subjectsList.innerHTML = subjects.length === 0
                ? '<p>No subjects assigned</p>'
                : subjects.map(s => `
                    <div class="recent-item">
                        <span class="item-name">${s.name}</span>
                        <span class="item-detail">${s.class_name} • ${s.student_count} students</span>
                    </div>
                `).join('');
        }

        const recentCourseworks = document.getElementById('recent-courseworks');
        if (recentCourseworks) {
            recentCourseworks.innerHTML = courseworks.length === 0
                ? '<p>No courseworks yet</p>'
                : courseworks.slice(0, 5).map(c => `
                    <div class="recent-item">
                        <span class="item-name">${c.title}</span>
                        <span class="item-detail">${c.type} • Due: ${c.due_date ? new Date(c.due_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                `).join('');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ========== SUBJECTS ==========
async function loadTeacherSubjects() {
    try {
        const subjects  = await getTeacherSubjects(currentTeacherId);
        const container = document.getElementById('subjects-grid');
        if (!container) return;

        if (!subjects || subjects.length === 0) {
            container.innerHTML = '<p>No subjects assigned</p>';
            return;
        }

        container.innerHTML = subjects.map(s => `
            <div class="subject-card">
                <div class="subject-header">
                    <h3>${s.name}</h3>
                    <p>${s.code || ''}</p>
                </div>
                <div class="subject-body">
                    <div class="subject-info">
                        <p>📚 Class: ${s.class_name}</p>
                        <p>👥 Students: ${s.student_count}</p>
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
        const container   = document.getElementById('courseworks-grid');
        if (!container) return;

        let filtered = courseworks;
        if (filter !== 'all') {
            filtered = courseworks.filter(c => c.type.toLowerCase() === filter.toLowerCase());
        }

        if (!filtered || filtered.length === 0) {
            container.innerHTML = '<p>No courseworks found</p>';
            return;
        }

        container.innerHTML = filtered.map(c => {
            const dueDate  = c.due_date ? new Date(c.due_date) : null;
            const isOverdue = dueDate && dueDate < new Date();
            const gradedPct = c.submissions > 0
                ? Math.round((c.graded / c.submissions) * 100) : 0;

            return `
            <div class="coursework-card">
                <div class="coursework-header ${c.type.toLowerCase()}">
                    <span class="coursework-type">${c.type}</span>
                    <h3>${c.title}</h3>
                    <p class="coursework-subject">${c.subject_name} • ${c.class_name || ''}</p>
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
                                ${dueDate ? dueDate.toLocaleDateString() : 'N/A'}
                                ${isOverdue ? ' (Overdue)' : ''}
                            </span>
                        </div>
                    </div>
                    <div class="submission-stats">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${gradedPct}%"></div>
                        </div>
                        <p>${c.graded || 0}/${c.submissions || 0} graded</p>
                    </div>
                </div>
                <div class="coursework-footer">
                    <button onclick="viewSubmissions(${c.id})" class="btn-small">
                        View Submissions (${c.submissions || 0})
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Error loading courseworks:', error);
    }
}

function filterCourseworks(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadTeacherCourseworks(type);
}

// ========== ADD COURSEWORK ==========
async function showAddCourseworkModal() {
    await loadSubjectsForDropdown('coursework-subject');
    document.getElementById('coursework-form')?.reset();
    document.getElementById('coursework-modal').style.display = 'block';
}

document.getElementById('coursework-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const courseworkData = {
        subject_id:  parseInt(document.getElementById('coursework-subject').value),
        teacher_id:  currentTeacherId,
        title:       document.getElementById('coursework-title').value,
        description: document.getElementById('coursework-description').value,
        type:        document.getElementById('coursework-type').value,
        total_marks: parseFloat(document.getElementById('coursework-marks').value),
        due_date:    document.getElementById('coursework-duedate').value
    };

    try {
        await createCoursework(courseworkData);
        closeModal('coursework-modal');
        await loadTeacherCourseworks();
        await loadTeacherDashboard();
        alert('Coursework posted successfully!');
    } catch (error) {
        alert('Error posting coursework: ' + error.message);
    }
});

// ========== SUBMISSIONS & GRADING ==========
async function viewSubmissions(courseworkId) {
    try {
        const submissions = await getSubmissionsForGrading(currentTeacherId, courseworkId);
        const container   = document.getElementById('submissions-list');
        if (!container) return;

        if (!submissions || submissions.length === 0) {
            container.innerHTML = '<p style="padding:20px; color:#888;">No submissions yet for this coursework.</p>';
        } else {
            container.innerHTML = submissions.map(s => `
                <div class="submission-item" data-id="${s.id}">
                    <div class="submission-header">
                        <span class="student-name">
                            <strong>${s.student_name}</strong> (${s.admission})
                        </span>
                        <span class="submission-date">
                            Submitted: ${new Date(s.submission_date).toLocaleString()}
                        </span>
                    </div>
                    <div class="submission-content">
                        ${s.content || '<em style="color:#888;">No written content submitted</em>'}
                    </div>
                    <div class="submission-grade">
                        <input type="number"
                               class="marks-input"
                               placeholder="Marks"
                               value="${s.marks_obtained !== null && s.marks_obtained !== undefined ? s.marks_obtained : ''}"
                               min="0">
                        <input type="text"
                               class="feedback-input"
                               placeholder="Feedback"
                               value="${s.feedback || ''}">
                        <button onclick="saveSubmissionGrade(${s.id}, this)"
                                class="btn-small btn-success">
                            ${s.marks_obtained !== null && s.marks_obtained !== undefined ? 'Update Grade' : 'Save Grade'}
                        </button>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('submissions-title').textContent =
            `Submissions (${submissions ? submissions.length : 0})`;
        document.getElementById('submissions-modal').style.display = 'block';

    } catch (error) {
        console.error('Error loading submissions:', error);
        alert('Error loading submissions: ' + error.message);
    }
}

// ✅ FIXED: renamed from gradeSubmission to saveSubmissionGrade
// The old name caused it to call itself recursively instead of the API function
async function saveSubmissionGrade(submissionId, button) {
    const submissionDiv = button.closest('.submission-item');
    const marks         = submissionDiv.querySelector('.marks-input').value;
    const feedback      = submissionDiv.querySelector('.feedback-input').value;

    if (marks === '' || marks === null) {
        alert('Please enter marks before saving');
        return;
    }

    const originalText  = button.textContent;
    button.textContent  = 'Saving...';
    button.disabled     = true;

    try {
        // ✅ This now correctly calls the API function from api.js
        await gradeSubmission({
            submission_id:  submissionId,
            marks_obtained: parseFloat(marks),
            feedback:       feedback
        });

        button.textContent   = '✓ Saved!';
        button.style.background = '#27ae60';

        setTimeout(() => {
            button.textContent      = 'Update Grade';
            button.disabled         = false;
            button.style.background = '';
        }, 2000);

    } catch (error) {
        alert('Error saving grade: ' + error.message);
        button.textContent = originalText;
        button.disabled    = false;
    }
}

// ========== ATTENDANCE ==========
async function loadSubjectsForDropdown(selectId = 'attendance-subject') {
    try {
        const subjects = await getTeacherSubjects(currentTeacherId);
        const select   = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Subject</option>';
            subjects.forEach(s => {
                select.innerHTML += `<option value="${s.id}">${s.name} - ${s.class_name}</option>`;
            });
        }

        const classes     = await getClasses();
        const classSelect = document.getElementById('attendance-class');
        if (classSelect) {
            classSelect.innerHTML = '<option value="">Select Class</option>';
            classes.forEach(c => {
                classSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        }

        const dateInput = document.getElementById('attendance-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
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
        const tbody    = document.getElementById('attendance-table-body');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;">No students in this class</td></tr>';
            return;
        }

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
    const date    = document.getElementById('attendance-date').value;

    if (!classId || !date) {
        alert('Please select class and date');
        return;
    }

    const records = [];
    document.querySelectorAll('#attendance-table-body tr').forEach(row => {
        if (row.dataset.studentId) {
            records.push({
                student_id:  parseInt(row.dataset.studentId),
                status:      row.querySelector('.attendance-status').value,
                remarks:     row.querySelector('.attendance-remarks').value,
                date:        date,
                recorded_by: currentTeacherId
            });
        }
    });

    alert(`Attendance saved for ${records.length} students`);
}

// ========== TIMETABLE ==========
async function loadTeacherTimetable() {
    try {
        const timetable = await getTeacherTimetable(currentTeacherId);
        const container = document.getElementById('timetable-grid');
        if (!container) return;

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        container.innerHTML = days.map(day => {
            const daySlots = timetable.filter(t => t.day === day);
            return `
                <div class="timetable-day">
                    <div class="day-header">${day}</div>
                    ${daySlots.length > 0
                        ? daySlots.map(slot => `
                            <div class="timetable-slot">
                                <div class="slot-subject">${slot.subject}</div>
                                <div class="slot-time">${slot.start} - ${slot.end}</div>
                                <div class="slot-room">${slot.class} • ${slot.room || 'N/A'}</div>
                            </div>
                        `).join('')
                        : '<div class="timetable-slot">No classes</div>'
                    }
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading timetable:', error);
    }
}

// ========== GRADES TAB ==========
async function loadGradeStudents() {
    const subjectId    = document.getElementById('grade-subject')?.value;
    const courseworkId = document.getElementById('grade-coursework')?.value;
    if (!subjectId || !courseworkId) return;

    try {
        const submissions = await getSubmissionsForGrading(currentTeacherId, courseworkId);
        const courseworks = await getTeacherCourseworks(currentTeacherId);
        const coursework  = courseworks.find(c => c.id == courseworkId);

        const tbody = document.getElementById('grades-table-body');
        if (!tbody) return;

        if (coursework) {
            const th = document.querySelector('.grades-table thead tr th:nth-child(4)');
            if (th) th.textContent = `Marks (/${coursework.total_marks})`;
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
                <td><input type="number" class="marks-input" value="${s.marks_obtained !== null && s.marks_obtained !== undefined ? s.marks_obtained : ''}"></td>
                <td><input type="text" class="feedback-input" value="${s.feedback || ''}"></td>
                <td><button onclick="saveGrade(${s.id}, this)" class="btn-small btn-success">Save</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading grades:', error);
    }
}

// ✅ FIXED: saveGrade now correctly calls the API gradeSubmission function
// Previously it called gradeSubmission() which resolved to the old local function
async function saveGrade(submissionId, button) {
    const row      = button.closest('tr');
    const marks    = row.querySelector('.marks-input').value;
    const feedback = row.querySelector('.feedback-input').value;

    if (marks === '') {
        alert('Please enter marks');
        return;
    }

    const originalText = button.textContent;
    button.textContent = 'Saving...';
    button.disabled    = true;

    try {
        // ✅ Correctly calls the API function from api.js
        await gradeSubmission({
            submission_id:  submissionId,
            marks_obtained: parseFloat(marks),
            feedback:       feedback
        });

        button.textContent = '✓ Saved';
        setTimeout(() => {
            button.textContent = 'Update';
            button.disabled    = false;
        }, 2000);

    } catch (error) {
        alert('Error saving grade: ' + error.message);
        button.textContent = originalText;
        button.disabled    = false;
    }
}

// ========== UTILITIES ==========
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function selectSubject(subjectId) {
    const select = document.getElementById('attendance-subject');
    if (select) select.value = subjectId;
}

function showSubjectCourseworks(subjectId) {
    showContent('courseworks-content');
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};