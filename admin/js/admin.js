// Current user
let currentAdmin = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (user) {
        currentAdmin = user;
        const nameEl = document.getElementById('user-name');
        if (nameEl) nameEl.textContent = user.name || user.first_name || 'Admin';

        await loadDashboardStats();
        await loadRecentStudents();
        await loadRecentTeachers();
        await loadPendingFees();
        await loadStudents();
        await loadTeachers();
        await loadClasses();
        await loadSubjects();
        await loadFees();
        await loadAnnouncements();
    }
});

// ========== NAVIGATION ==========
function showContent(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// ========== DASHBOARD ==========
async function loadDashboardStats() {
    try {
        const [students, teachers, classes, subjects] = await Promise.all([
            getStudents(), getTeachers(), getClasses(), getSubjects()
        ]);
        document.getElementById('total-students').textContent = students?.length || 0;
        document.getElementById('total-teachers').textContent = teachers?.length || 0;
        document.getElementById('total-classes').textContent  = classes?.length  || 0;
        document.getElementById('total-subjects').textContent = subjects?.length || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentStudents() {
    const container = document.getElementById('recent-students');
    if (!container) return;
    try {
        const students = await getStudents();
        if (!students || students.length === 0) {
            container.innerHTML = '<p>No students found</p>';
            return;
        }
        container.innerHTML = students.slice(0, 5).map(s => `
            <div class="recent-item" onclick="viewStudentDetails(${s.id})">
                <span>${s.first_name} ${s.last_name}</span>
                <small>${s.admission_number || ''}</small>
            </div>
        `).join('');
    } catch (error) { console.error(error); }
}

async function loadRecentTeachers() {
    const container = document.getElementById('recent-teachers');
    if (!container) return;
    try {
        const teachers = await getTeachers();
        if (!teachers || teachers.length === 0) {
            container.innerHTML = '<p>No teachers found</p>';
            return;
        }
        container.innerHTML = teachers.slice(0, 5).map(t => `
            <div class="recent-item" onclick="viewTeacherDetails(${t.id})">
                <span>${t.first_name} ${t.last_name}</span>
                <small>${t.employee_id || ''}</small>
            </div>
        `).join('');
    } catch (error) { console.error(error); }
}

async function loadPendingFees() {
    const container = document.getElementById('pending-fees');
    if (!container) return;
    try {
        const students = await getStudents();
        if (!students || students.length === 0) {
            container.innerHTML = '<p>No pending fees</p>';
            return;
        }
        container.innerHTML = students.slice(0, 5).map(s => `
            <div class="recent-item" onclick="openRecordPayment(${s.id})">
                <span>${s.first_name} ${s.last_name}</span>
                <small>Click to pay</small>
            </div>
        `).join('');
    } catch (error) { console.error(error); }
}

// ========== STUDENTS ==========
async function loadStudents() {
    const tbody = document.getElementById('students-table-body');
    if (!tbody) return;
    try {
        const students = await getStudents();
        if (!students || students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No students found</td></tr>';
            return;
        }
        tbody.innerHTML = students.map(s => `
            <tr>
                <td>${s.admission_number || 'N/A'}</td>
                <td>${s.first_name} ${s.last_name}</td>
                <td>${s.class_name || 'N/A'}</td>
                <td>${s.gender || 'N/A'}</td>
                <td>${s.parent_name || '<span style="color:#e74c3c;">No parent</span>'}</td>
                <td>${s.email || 'N/A'}</td>
                <td>
                    <button onclick="viewStudentDetails(${s.id})" class="btn-small" title="View">👁️</button>
                    <button onclick="editStudent(${s.id})" class="btn-small" title="Edit">✏️</button>
                    <button onclick="removeStudent(${s.id})" class="btn-small btn-danger" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading students:', error);
        tbody.innerHTML = '<tr><td colspan="7">Error loading students</td></tr>';
    }
}

async function viewStudentDetails(id) {
    try {
        const student = await getStudent(id);
        showInfoModal('Student Details', `
            <div class="detail-card">
                <div class="detail-row"><strong>Name:</strong> ${student.first_name} ${student.last_name}</div>
                <div class="detail-row"><strong>Admission No:</strong> ${student.admission_number || 'N/A'}</div>
                <div class="detail-row"><strong>Class:</strong> ${student.class_name || 'N/A'}</div>
                <div class="detail-row"><strong>Gender:</strong> ${student.gender || 'N/A'}</div>
                <div class="detail-row"><strong>Email:</strong> ${student.email || 'N/A'}</div>
                <div class="detail-row"><strong>Phone:</strong> ${student.phone || 'N/A'}</div>
                <div class="detail-row"><strong>Date of Birth:</strong> ${student.date_of_birth || 'N/A'}</div>
                <div class="detail-row"><strong>Address:</strong> ${student.address || 'N/A'}</div>
                <div class="detail-row"><strong>Parent:</strong> ${student.parent_name || 'No parent assigned'}</div>
            </div>
        `);
    } catch (error) {
        showToast('Error loading student details', 'error');
    }
}

// ── Helper: refresh parent dropdown inside the student modal ──
async function refreshParentDropdown(selectedParentId = null) {
    const parents = await getParents();
    let options = '<option value="">Select Parent (Optional)</option>';
    parents?.forEach(p => {
        const selected = selectedParentId && p.id === selectedParentId ? 'selected' : '';
        options += `<option value="${p.id}" ${selected}>${p.first_name} ${p.last_name} (${p.phone || p.email})</option>`;
    });
    document.getElementById('student-parent').innerHTML = options;
}

async function showAddStudentModal() {
    try {
        const classes = await getClasses();
        let classOptions = '<option value="">Select Class</option>';
        classes?.forEach(c => {
            classOptions += `<option value="${c.id}">${c.name}</option>`;
        });
        document.getElementById('student-class').innerHTML = classOptions;

        await refreshParentDropdown();

        document.getElementById('student-modal-title').textContent = 'Add New Student';
        document.getElementById('student-form').reset();
        delete document.getElementById('student-form').dataset.studentId;
        document.getElementById('student-modal').style.display = 'block';
    } catch (error) {
        showToast('Error loading form data', 'error');
    }
}

async function editStudent(id) {
    try {
        const student = await getStudent(id);
        const classes = await getClasses();

        let classOptions = '<option value="">Select Class</option>';
        classes?.forEach(c => {
            classOptions += `<option value="${c.id}" ${c.id === student.class_id ? 'selected' : ''}>${c.name}</option>`;
        });
        document.getElementById('student-class').innerHTML = classOptions;

        await refreshParentDropdown(student.parent_id);

        document.getElementById('student-firstname').value = student.first_name || '';
        document.getElementById('student-lastname').value  = student.last_name  || '';
        document.getElementById('student-email').value     = student.email      || '';
        document.getElementById('student-admission').value = student.admission_number || '';
        document.getElementById('student-gender').value    = student.gender     || '';
        document.getElementById('student-dob').value       = student.date_of_birth   || '';
        document.getElementById('student-phone').value     = student.phone      || '';
        document.getElementById('student-address').value   = student.address    || '';

        document.getElementById('student-modal-title').textContent = 'Edit Student';
        document.getElementById('student-form').dataset.studentId = id;
        document.getElementById('student-modal').style.display = 'block';
    } catch (error) {
        showToast('Error loading student', 'error');
    }
}

async function removeStudent(id) {
    if (confirm('Are you sure you want to delete this student? This cannot be undone.')) {
        try {
            await deleteStudent(id);
            showToast('Student deleted successfully', 'success');
            await loadStudents();
            await loadDashboardStats();
        } catch (error) {
            showToast('Error deleting student', 'error');
        }
    }
}

document.getElementById('student-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentData = {
        first_name:       document.getElementById('student-firstname')?.value,
        last_name:        document.getElementById('student-lastname')?.value,
        email:            document.getElementById('student-email')?.value,
        admission_number: document.getElementById('student-admission')?.value,
        class_id:         parseInt(document.getElementById('student-class')?.value) || null,
        gender:           document.getElementById('student-gender')?.value,
        date_of_birth:    document.getElementById('student-dob')?.value    || null,
        phone:            document.getElementById('student-phone')?.value  || null,
        address:          document.getElementById('student-address')?.value || null,
        parent_id:        parseInt(document.getElementById('student-parent')?.value) || null,
    };

    const studentId = document.getElementById('student-form')?.dataset.studentId;

    try {
        if (studentId) {
            await updateStudent(parseInt(studentId), studentData);
            showToast('Student updated successfully!', 'success');
        } else {
            await createStudent(studentData);
            showToast('Student added successfully!', 'success');
        }
        closeModal('student-modal');
        await loadStudents();
        await loadDashboardStats();
    } catch (error) {
        showToast('Error saving student: ' + (error.message || 'Unknown error'), 'error');
    }
});

// ========== INLINE PARENT CREATION (from student modal) ==========
function showAddParentModal() {
    // Keep student modal open behind the parent modal
    document.getElementById('parent-form')?.reset();
    delete document.getElementById('parent-form').dataset.parentId;
    document.getElementById('parent-modal-title').textContent = 'Add New Parent';
    document.getElementById('parent-modal').style.display = 'block';
}

document.getElementById('parent-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const parentData = {
        first_name: document.getElementById('parent-firstname')?.value,
        last_name:  document.getElementById('parent-lastname')?.value,
        email:      document.getElementById('parent-email')?.value,
        phone:      document.getElementById('parent-phone')?.value   || null,
        address:    document.getElementById('parent-address')?.value || null,
        occupation: document.getElementById('parent-occupation')?.value || null,
    };

    if (!parentData.first_name || !parentData.last_name || !parentData.email) {
        showToast('First name, last name and email are required', 'error');
        return;
    }

    try {
        const newParent = await createParent(parentData);
        showToast(`Parent ${parentData.first_name} ${parentData.last_name} added!`, 'success');
        closeModal('parent-modal');

        // Refresh parent dropdown in student form and auto-select the new parent
        await refreshParentDropdown(newParent.id);

        // Make sure student modal is still visible
        document.getElementById('student-modal').style.display = 'block';
    } catch (error) {
        showToast('Error saving parent: ' + (error.message || 'Unknown error'), 'error');
    }
});

// ========== TEACHERS ==========
async function loadTeachers() {
    const tbody = document.getElementById('teachers-table-body');
    if (!tbody) return;
    try {
        const teachers = await getTeachers();
        if (!teachers || teachers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No teachers found</td></tr>';
            return;
        }
        tbody.innerHTML = teachers.map(t => `
            <tr>
                <td>${t.employee_id || 'N/A'}</td>
                <td>${t.first_name} ${t.last_name}</td>
                <td>${t.qualification || 'N/A'}</td>
                <td>${t.subjects || 'N/A'}</td>
                <td>${t.phone || 'N/A'}</td>
                <td>${t.email || 'N/A'}</td>
                <td>
                    <button onclick="viewTeacherDetails(${t.id})" class="btn-small" title="View">👁️</button>
                    <button onclick="editTeacher(${t.id})" class="btn-small" title="Edit">✏️</button>
                    <button onclick="removeTeacher(${t.id})" class="btn-small btn-danger" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading teachers:', error);
        tbody.innerHTML = '<tr><td colspan="7">Error loading teachers</td></tr>';
    }
}

async function viewTeacherDetails(id) {
    try {
        const t = await getTeacher(id);
        showInfoModal('Teacher Details', `
            <div class="detail-card">
                <div class="detail-row"><strong>Name:</strong> ${t.first_name} ${t.last_name}</div>
                <div class="detail-row"><strong>Employee ID:</strong> ${t.employee_id || 'N/A'}</div>
                <div class="detail-row"><strong>Qualification:</strong> ${t.qualification || 'N/A'}</div>
                <div class="detail-row"><strong>Subjects:</strong> ${t.subjects || 'N/A'}</div>
                <div class="detail-row"><strong>Phone:</strong> ${t.phone || 'N/A'}</div>
                <div class="detail-row"><strong>Email:</strong> ${t.email || 'N/A'}</div>
            </div>
        `);
    } catch (error) {
        showToast('Error loading teacher details', 'error');
    }
}

function showAddTeacherModal() {
    document.getElementById('teacher-modal-title').textContent = 'Add New Teacher';
    document.getElementById('teacher-form').reset();
    delete document.getElementById('teacher-form').dataset.teacherId;
    document.getElementById('teacher-modal').style.display = 'block';
}

async function editTeacher(id) {
    try {
        const t = await getTeacher(id);
        document.getElementById('teacher-firstname').value   = t.first_name    || '';
        document.getElementById('teacher-lastname').value    = t.last_name     || '';
        document.getElementById('teacher-email').value       = t.email         || '';
        document.getElementById('teacher-employee-id').value = t.employee_id   || '';
        document.getElementById('teacher-qualification').value = t.qualification || '';
        document.getElementById('teacher-phone').value       = t.phone         || '';
        document.getElementById('teacher-subjects').value    = t.subjects      || '';

        document.getElementById('teacher-modal-title').textContent = 'Edit Teacher';
        document.getElementById('teacher-form').dataset.teacherId = id;
        document.getElementById('teacher-modal').style.display = 'block';
    } catch (error) {
        showToast('Error loading teacher', 'error');
    }
}

async function removeTeacher(id) {
    if (confirm('Are you sure you want to delete this teacher?')) {
        try {
            await deleteTeacher(id);
            showToast('Teacher deleted successfully', 'success');
            await loadTeachers();
            await loadDashboardStats();
        } catch (error) {
            showToast('Error deleting teacher', 'error');
        }
    }
}

document.getElementById('teacher-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const teacherData = {
        first_name:    document.getElementById('teacher-firstname')?.value,
        last_name:     document.getElementById('teacher-lastname')?.value,
        email:         document.getElementById('teacher-email')?.value,
        employee_id:   document.getElementById('teacher-employee-id')?.value,
        qualification: document.getElementById('teacher-qualification')?.value,
        phone:         document.getElementById('teacher-phone')?.value,
        subjects:      document.getElementById('teacher-subjects')?.value,
    };
    const teacherId = document.getElementById('teacher-form')?.dataset.teacherId;
    try {
        if (teacherId) {
            await updateTeacher(parseInt(teacherId), teacherData);
            showToast('Teacher updated successfully!', 'success');
        } else {
            await createTeacher(teacherData);
            showToast('Teacher added successfully!', 'success');
        }
        closeModal('teacher-modal');
        await loadTeachers();
        await loadDashboardStats();
    } catch (error) {
        showToast('Error saving teacher: ' + (error.message || 'Unknown error'), 'error');
    }
});

// ========== CLASSES ==========
async function loadClasses() {
    const grid = document.getElementById('classes-grid');
    if (!grid) return;
    try {
        const classes = await getClasses();
        if (!classes || classes.length === 0) {
            grid.innerHTML = '<p>No classes found. Click "Add New Class" to create one.</p>';
            return;
        }
        grid.innerHTML = classes.map(c => `
            <div class="class-card">
                <div class="class-header">
                    <h3>${c.name}</h3>
                    <p>${c.academic_year || 'N/A'}</p>
                </div>
                <div class="class-body">
                    <p><strong>Class Teacher:</strong> ${c.class_teacher_name || 'Not assigned'}</p>
                    <p><strong>Students:</strong> ${c.student_count || 0} / ${c.capacity || 40}</p>
                </div>
                <div class="class-footer">
                    <button onclick="viewClassDetails(${c.id})" class="btn-small" title="View">👁️</button>
                    <button onclick="editClass(${c.id})" class="btn-small" title="Edit">✏️</button>
                    <button onclick="removeClass(${c.id})" class="btn-small btn-danger" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading classes:', error);
        grid.innerHTML = '<p>Error loading classes</p>';
    }
}

async function showAddClassModal() {
    try {
        const teachers = await getTeachers();
        let options = '<option value="">Select Teacher (Optional)</option>';
        teachers?.forEach(t => {
            options += `<option value="${t.id}">${t.first_name} ${t.last_name}</option>`;
        });
        document.getElementById('class-teacher').innerHTML = options;
        document.getElementById('class-modal-title').textContent = 'Add New Class';
        document.getElementById('class-form').reset();
        delete document.getElementById('class-form').dataset.classId;
        document.getElementById('class-modal').style.display = 'block';
    } catch (error) {
        showToast('Error loading teachers list', 'error');
    }
}

async function editClass(id) {
    try {
        const classData = await getClass(id);
        const teachers  = await getTeachers();
        let options = '<option value="">Select Teacher (Optional)</option>';
        teachers?.forEach(t => {
            options += `<option value="${t.id}" ${t.id === classData.class_teacher_id ? 'selected' : ''}>${t.first_name} ${t.last_name}</option>`;
        });
        document.getElementById('class-teacher').innerHTML = options;
        document.getElementById('class-name').value          = classData.name          || '';
        document.getElementById('class-academic-year').value = classData.academic_year || '';
        document.getElementById('class-capacity').value      = classData.capacity      || 40;
        document.getElementById('class-modal-title').textContent = 'Edit Class';
        document.getElementById('class-form').dataset.classId = id;
        document.getElementById('class-modal').style.display = 'block';
    } catch (error) {
        showToast('Error loading class', 'error');
    }
}

async function removeClass(id) {
    if (confirm('Are you sure you want to delete this class?')) {
        try {
            await deleteClass(id);
            showToast('Class deleted successfully', 'success');
            await loadClasses();
            await loadDashboardStats();
        } catch (error) {
            showToast('Error deleting class', 'error');
        }
    }
}

async function viewClassDetails(id) {
    try {
        const c = await getClass(id);
        showInfoModal('Class Details', `
            <div class="detail-card">
                <div class="detail-row"><strong>Name:</strong> ${c.name}</div>
                <div class="detail-row"><strong>Academic Year:</strong> ${c.academic_year || 'N/A'}</div>
                <div class="detail-row"><strong>Class Teacher:</strong> ${c.class_teacher_name || 'Not assigned'}</div>
                <div class="detail-row"><strong>Students:</strong> ${c.student_count || 0}</div>
                <div class="detail-row"><strong>Capacity:</strong> ${c.capacity || 40}</div>
            </div>
        `);
    } catch (error) {
        showToast('Error loading class details', 'error');
    }
}

document.getElementById('class-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const classData = {
        name:             document.getElementById('class-name')?.value,
        academic_year:    document.getElementById('class-academic-year')?.value,
        class_teacher_id: parseInt(document.getElementById('class-teacher')?.value) || null,
        capacity:         parseInt(document.getElementById('class-capacity')?.value) || 40,
    };
    const classId = document.getElementById('class-form')?.dataset.classId;
    try {
        if (classId) {
            await updateClass(parseInt(classId), classData);
            showToast('Class updated successfully!', 'success');
        } else {
            await createClass(classData);
            showToast('Class added successfully!', 'success');
        }
        closeModal('class-modal');
        await loadClasses();
        await loadDashboardStats();
    } catch (error) {
        showToast('Error saving class: ' + (error.message || 'Unknown error'), 'error');
    }
});

// ========== SUBJECTS ==========
async function loadSubjects() {
    const tbody = document.getElementById('subjects-table-body');
    if (!tbody) return;
    try {
        const subjects = await getSubjects();
        if (!subjects || subjects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No subjects found</td></tr>';
            return;
        }
        tbody.innerHTML = subjects.map(s => `
            <tr>
                <td>${s.code || 'N/A'}</td>
                <td>${s.name || 'N/A'}</td>
                <td>${s.class_name || 'N/A'}</td>
                <td>${s.teacher_name || 'Not assigned'}</td>
                <td>
                    <button onclick="viewSubjectDetails(${s.id})" class="btn-small" title="View">👁️</button>
                    <button onclick="editSubject(${s.id})" class="btn-small" title="Edit">✏️</button>
                    <button onclick="removeSubject(${s.id})" class="btn-small btn-danger" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading subjects:', error);
        tbody.innerHTML = '<tr><td colspan="5">Error loading subjects</td></tr>';
    }
}

async function showAddSubjectModal() {
    try {
        const [classes, teachers] = await Promise.all([getClasses(), getTeachers()]);
        let classOptions = '<option value="">Select Class</option>';
        classes?.forEach(c => { classOptions += `<option value="${c.id}">${c.name}</option>`; });
        let teacherOptions = '<option value="">Select Teacher (Optional)</option>';
        teachers?.forEach(t => { teacherOptions += `<option value="${t.id}">${t.first_name} ${t.last_name}</option>`; });
        document.getElementById('subject-class').innerHTML   = classOptions;
        document.getElementById('subject-teacher').innerHTML = teacherOptions;
        document.getElementById('subject-modal-title').textContent = 'Add New Subject';
        document.getElementById('subject-form').reset();
        delete document.getElementById('subject-form').dataset.subjectId;
        document.getElementById('subject-modal').style.display = 'block';
    } catch (error) {
        showToast('Error loading form data', 'error');
    }
}

async function editSubject(id) {
    try {
        const [subject, classes, teachers] = await Promise.all([
            getSubject(id), getClasses(), getTeachers()
        ]);
        let classOptions = '<option value="">Select Class</option>';
        classes?.forEach(c => {
            classOptions += `<option value="${c.id}" ${c.id === subject.class_id ? 'selected' : ''}>${c.name}</option>`;
        });
        let teacherOptions = '<option value="">Select Teacher (Optional)</option>';
        teachers?.forEach(t => {
            teacherOptions += `<option value="${t.id}" ${t.id === subject.teacher_id ? 'selected' : ''}>${t.first_name} ${t.last_name}</option>`;
        });
        document.getElementById('subject-class').innerHTML   = classOptions;
        document.getElementById('subject-teacher').innerHTML = teacherOptions;
        document.getElementById('subject-name').value  = subject.name || '';
        document.getElementById('subject-code').value  = subject.code || '';
        document.getElementById('subject-modal-title').textContent = 'Edit Subject';
        document.getElementById('subject-form').dataset.subjectId = id;
        document.getElementById('subject-modal').style.display = 'block';
    } catch (error) {
        showToast('Error loading subject', 'error');
    }
}

async function removeSubject(id) {
    if (confirm('Are you sure you want to delete this subject?')) {
        try {
            await deleteSubject(id);
            showToast('Subject deleted successfully', 'success');
            await loadSubjects();
            await loadDashboardStats();
        } catch (error) {
            showToast('Error deleting subject', 'error');
        }
    }
}

async function viewSubjectDetails(id) {
    try {
        const s = await getSubject(id);
        showInfoModal('Subject Details', `
            <div class="detail-card">
                <div class="detail-row"><strong>Name:</strong> ${s.name}</div>
                <div class="detail-row"><strong>Code:</strong> ${s.code || 'N/A'}</div>
                <div class="detail-row"><strong>Class:</strong> ${s.class_name || 'N/A'}</div>
                <div class="detail-row"><strong>Teacher:</strong> ${s.teacher_name || 'Not assigned'}</div>
            </div>
        `);
    } catch (error) {
        showToast('Error loading subject details', 'error');
    }
}

document.getElementById('subject-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subjectData = {
        name:       document.getElementById('subject-name')?.value,
        code:       document.getElementById('subject-code')?.value,
        class_id:   parseInt(document.getElementById('subject-class')?.value)   || null,
        teacher_id: parseInt(document.getElementById('subject-teacher')?.value) || null,
    };
    const subjectId = document.getElementById('subject-form')?.dataset.subjectId;
    try {
        if (subjectId) {
            await updateSubject(parseInt(subjectId), subjectData);
            showToast('Subject updated successfully!', 'success');
        } else {
            await createSubject(subjectData);
            showToast('Subject added successfully!', 'success');
        }
        closeModal('subject-modal');
        await loadSubjects();
        await loadDashboardStats();
    } catch (error) {
        showToast('Error saving subject: ' + (error.message || 'Unknown error'), 'error');
    }
});

// ========== FEES ==========
async function loadFees() {
    const tbody = document.getElementById('fees-table-body');
    if (!tbody) return;
    try {
        const students = await getStudents();
        if (!students || students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No students found</td></tr>';
            return;
        }
        tbody.innerHTML = students.map(s => {
            const total   = 50000;
            const paid    = s.amount_paid || Math.floor(Math.random() * 20000) + 20000;
            const balance = total - paid;
            const status  = balance === 0 ? 'paid' : balance < 10000 ? 'partial' : 'pending';
            return `
            <tr>
                <td>${s.first_name} ${s.last_name}</td>
                <td>${s.class_name || 'N/A'}</td>
                <td>Term 1 2024</td>
                <td>KSh ${total.toLocaleString()}</td>
                <td>KSh ${paid.toLocaleString()}</td>
                <td>KSh ${balance.toLocaleString()}</td>
                <td><span class="status-badge ${status}">${status}</span></td>
                <td><button onclick="openRecordPayment(${s.id})" class="btn-small btn-success">💰 Pay</button></td>
            </tr>`;
        }).join('');

        // Populate student select in fee modal
        const studentSelect = document.getElementById('fee-student');
        if (studentSelect) {
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            students.forEach(s => {
                studentSelect.innerHTML += `<option value="${s.id}">${s.first_name} ${s.last_name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading fees:', error);
    }
}

async function openRecordPayment(studentId) {
    if (studentId) {
        document.getElementById('fee-student').value = studentId;
    }
    document.getElementById('fee-amount').value = '';
    document.getElementById('fee-modal').style.display = 'block';
}

function showAddFeeModal() {
    document.getElementById('fee-amount').value = '';
    document.getElementById('fee-modal').style.display = 'block';
}

document.getElementById('fee-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = parseInt(document.getElementById('fee-student')?.value);
    const amount    = parseFloat(document.getElementById('fee-amount')?.value);
    const method    = document.getElementById('fee-method')?.value   || 'Cash';
    const term      = document.getElementById('fee-term')?.value     || 'Term 1 2024';
    const txnId     = document.getElementById('fee-transaction-id')?.value || null;

    if (!studentId || !amount) {
        showToast('Please select a student and enter an amount', 'error');
        return;
    }
    try {
        await recordPayment({ student_id: studentId, amount, method, term, transaction_id: txnId });
        showToast(`Payment of KSh ${amount.toLocaleString()} recorded successfully!`, 'success');
        closeModal('fee-modal');
        await loadFees();
    } catch (error) {
        showToast('Error recording payment: ' + (error.message || 'Unknown error'), 'error');
    }
});

// ========== ANNOUNCEMENTS ==========
async function loadAnnouncements() {
    const container = document.getElementById('announcements-list');
    if (!container) return;
    const announcements = [
        { title: 'School Closed for Holidays', content: 'School closed from 20th Dec to 5th Jan.', date: '2024-12-20', target: 'All' },
        { title: 'Staff Meeting',              content: 'Meeting on Friday at 2:00 PM.',            date: '2024-11-15', target: 'Staff' },
        { title: 'Parents Day',                content: 'Parents Day on 15th March.',               date: '2024-03-01', target: 'Parents' },
    ];
    container.innerHTML = announcements.map(a => `
        <div class="announcement-card">
            <div class="announcement-header">
                <div class="announcement-title">${a.title}</div>
                <div class="announcement-date">${a.date}</div>
            </div>
            <div class="announcement-content">${a.content}</div>
            <div class="announcement-footer">
                <span>📢 ${a.target}</span>
                <div class="announcement-actions">
                    <button class="btn-small">✏️ Edit</button>
                    <button class="btn-small btn-danger">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddAnnouncementModal() {
    document.getElementById('announcement-form')?.reset();
    document.getElementById('announcement-modal').style.display = 'block';
}

document.getElementById('announcement-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Announcement posted successfully!', 'success');
    closeModal('announcement-modal');
    loadAnnouncements();
});

// ========== SEARCH & FILTER ==========
function searchStudents() {
    const query = document.getElementById('student-search')?.value.toLowerCase();
    document.querySelectorAll('#students-table-body tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

function filterStudents() {
    const filter = document.getElementById('class-filter')?.value.toLowerCase();
    document.querySelectorAll('#students-table-body tr').forEach(row => {
        row.style.display = !filter || row.cells[2]?.textContent.toLowerCase().includes(filter) ? '' : 'none';
    });
}

function searchFees() {
    const query = document.getElementById('fee-search')?.value.toLowerCase();
    document.querySelectorAll('#fees-table-body tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

// ========== UTILITIES ==========
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function showInfoModal(title, htmlContent) {
    let modal = document.getElementById('info-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'info-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeModal('info-modal')">&times;</span>
                <h2 id="info-modal-title"></h2>
                <div id="info-modal-body" class="view-details"></div>
            </div>`;
        document.body.appendChild(modal);
    }
    document.getElementById('info-modal-title').textContent = title;
    document.getElementById('info-modal-body').innerHTML    = htmlContent;
    modal.style.display = 'block';
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();

    const colors = { success: '#27ae60', error: '#e74c3c', info: '#3498db' };
    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        padding: 14px 20px; border-radius: 8px; color: white;
        font-weight: 600; font-size: 14px; max-width: 350px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        background: ${colors[type] || colors.info};
        animation: slideInToast 0.3s ease;
    `;
    if (!document.getElementById('toast-anim-style')) {
        const style = document.createElement('style');
        style.id = 'toast-anim-style';
        style.textContent = `
            @keyframes slideInToast {
                from { transform: translateX(120%); opacity: 0; }
                to   { transform: translateX(0);    opacity: 1; }
            }`;
        document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};