// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadRecentStudents();
    loadPendingFees();
    loadUpcomingExams();
    loadStudents();
    loadTeachers();
    loadClasses();
    loadSubjects();
    loadFees();
    loadAnnouncements();
});

// Show content sections
function showContent(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Update active menu
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(sectionId)) {
            link.classList.add('active');
        }
    });
}

// ========== DASHBOARD ==========
async function loadDashboardStats() {
    try {
        const stats = await getDashboardStats();
        document.getElementById('total-students').textContent = stats.totalStudents || 0;
        document.getElementById('total-teachers').textContent = stats.totalTeachers || 0;
        document.getElementById('total-classes').textContent = stats.totalClasses || 0;
        
        const subjects = await getSubjects();
        document.getElementById('total-subjects').textContent = subjects.length || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentStudents() {
    try {
        const students = await getRecentStudents();
        const container = document.getElementById('recent-students');
        
        if (!students || students.length === 0) {
            container.innerHTML = '<p>No recent students</p>';
            return;
        }
        
        container.innerHTML = students.map(s => `
            <div class="recent-item">
                <span class="item-name">${s.name}</span>
                <span class="item-detail">${s.admission_number}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent students:', error);
    }
}

async function loadPendingFees() {
    try {
        const fees = await getPendingFees();
        const container = document.getElementById('pending-fees');
        
        if (!fees || fees.length === 0) {
            container.innerHTML = '<p>No pending fees</p>';
            return;
        }
        
        container.innerHTML = fees.map(f => `
            <div class="recent-item">
                <span class="item-name">${f.student_name}</span>
                <span class="item-detail">KSh ${f.balance.toLocaleString()}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading pending fees:', error);
    }
}

async function loadUpcomingExams() {
    try {
        const exams = await getUpcomingExams();
        const container = document.getElementById('upcoming-exams');
        
        if (!exams || exams.length === 0) {
            container.innerHTML = '<p>No upcoming exams</p>';
            return;
        }
        
        container.innerHTML = exams.map(e => `
            <div class="recent-item">
                <span class="item-name">${e.name}</span>
                <span class="item-detail">${e.date}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading upcoming exams:', error);
    }
}

// ========== STUDENTS ==========
async function loadStudents() {
    try {
        const students = await getStudents();
        const tbody = document.getElementById('students-table-body');
        
        if (!students || students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No students found</td></tr>';
            return;
        }
        
        tbody.innerHTML = students.map(s => `
            <tr data-class="${s.class_id}">
                <td>${s.admission_number}</td>
                <td>${s.first_name} ${s.last_name}</td>
                <td>${s.class_name || 'N/A'}</td>
                <td>${s.gender || 'N/A'}</td>
                <td>${s.parent_name || 'N/A'}</td>
                <td>
                    <button onclick="editStudent(${s.id})" class="btn-small">Edit</button>
                    <button onclick="deleteStudent(${s.id})" class="btn-small btn-danger">Delete</button>
                    <button onclick="viewStudent(${s.id})" class="btn-small">View</button>
                </td>
            </tr>
        `).join('');
        
        // Load classes for filter
        const classes = await getClasses();
        const filter = document.getElementById('class-filter');
        filter.innerHTML = '<option value="">All Classes</option>';
        classes.forEach(c => {
            filter.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function searchStudents() {
    const search = document.getElementById('student-search').value.toLowerCase();
    const rows = document.querySelectorAll('#students-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

function filterStudents() {
    const classFilter = document.getElementById('class-filter').value;
    const rows = document.querySelectorAll('#students-table-body tr');
    
    rows.forEach(row => {
        const studentClass = row.getAttribute('data-class');
        row.style.display = (!classFilter || studentClass === classFilter) ? '' : 'none';
    });
}

// ========== TEACHERS ==========
async function loadTeachers() {
    try {
        const teachers = await getTeachers();
        const tbody = document.getElementById('teachers-table-body');
        
        if (!teachers || teachers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No teachers found</td></tr>';
            return;
        }
        
        tbody.innerHTML = teachers.map(t => `
            <tr>
                <td>${t.employee_id || 'N/A'}</td>
                <td>${t.first_name} ${t.last_name}</td>
                <td>${t.qualification || 'N/A'}</td>
                <td>Teaching subjects</td>
                <td>
                    <button onclick="editTeacher(${t.id})" class="btn-small">Edit</button>
                    <button onclick="deleteTeacher(${t.id})" class="btn-small btn-danger">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

// ========== CLASSES ==========
async function loadClasses() {
    try {
        const classes = await getClasses();
        const container = document.getElementById('classes-grid');
        
        if (!classes || classes.length === 0) {
            container.innerHTML = '<p>No classes found</p>';
            return;
        }
        
        container.innerHTML = classes.map(c => `
            <div class="class-card">
                <div class="class-header">
                    <h3>${c.name}</h3>
                    <p>${c.academic_year}</p>
                </div>
                <div class="class-body">
                    <p><strong>Class Teacher:</strong> ${c.class_teacher_name || 'Not assigned'}</p>
                    <p><strong>Capacity:</strong> ${c.student_count}/${c.capacity}</p>
                </div>
                <div class="class-stats">
                    <div class="stat">
                        <span class="value">${c.student_count}</span>
                        <span class="label">Students</span>
                    </div>
                    <div class="stat">
                        <span class="value">4</span>
                        <span class="label">Subjects</span>
                    </div>
                </div>
                <div class="class-footer">
                    <button onclick="editClass(${c.id})" class="btn-small">Edit</button>
                    <button onclick="viewClass(${c.id})" class="btn-small">View</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

// ========== SUBJECTS ==========
async function loadSubjects() {
    try {
        const subjects = await getSubjects();
        const tbody = document.getElementById('subjects-table-body');
        
        if (!subjects || subjects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No subjects found</td></tr>';
            return;
        }
        
        tbody.innerHTML = subjects.map(s => `
            <tr>
                <td>${s.code}</td>
                <td>${s.name}</td>
                <td>${s.class_name || 'N/A'}</td>
                <td>${s.teacher_name || 'Not assigned'}</td>
                <td>
                    <button onclick="editSubject(${s.id})" class="btn-small">Edit</button>
                    <button onclick="deleteSubject(${s.id})" class="btn-small btn-danger">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// ========== FEES ==========
async function loadFees() {
    try {
        const students = await getStudents();
        const tbody = document.getElementById('fees-table-body');
        
        if (!students || students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No fee records found</td></tr>';
            return;
        }
        
        // For demo, create sample fee data
        tbody.innerHTML = students.map(s => {
            const balance = Math.floor(Math.random() * 20000);
            const status = balance === 0 ? 'paid' : balance < 10000 ? 'partial' : 'pending';
            return `
            <tr>
                <td>${s.first_name} ${s.last_name}</td>
                <td>Term 1 2024</td>
                <td>KSh 50,000</td>
                <td>KSh ${(50000 - balance).toLocaleString()}</td>
                <td>KSh ${balance.toLocaleString()}</td>
                <td><span class="status-badge ${status}">${status}</span></td>
                <td>
                    <button onclick="recordPayment(${s.id})" class="btn-small">Record Payment</button>
                    <button onclick="viewTransactions(${s.id})" class="btn-small">View</button>
                </td>
            </tr>
        `}).join('');
    } catch (error) {
        console.error('Error loading fees:', error);
    }
}

// ========== ANNOUNCEMENTS ==========
async function loadAnnouncements() {
    const container = document.getElementById('announcements-list');
    
    // Sample announcements for demo
    const announcements = [
        {
            title: 'School Closed for Holidays',
            content: 'School will be closed from 20th December to 5th January',
            date: '2024-12-15',
            target: 'All Users'
        },
        {
            title: 'Staff Meeting',
            content: 'All teachers please attend meeting on Friday at 2pm',
            date: '2024-11-10',
            target: 'Teachers Only'
        },
        {
            title: 'Parents Day',
            content: 'Parents Day will be held on 15th March',
            date: '2024-02-20',
            target: 'Parents Only'
        }
    ];
    
    container.innerHTML = announcements.map(a => `
        <div class="announcement-card">
            <div class="announcement-header">
                <span class="announcement-title">${a.title}</span>
                <span class="announcement-date">${a.date}</span>
            </div>
            <div class="announcement-content">
                ${a.content}
            </div>
            <div class="announcement-footer">
                <span>Target: ${a.target}</span>
                <span>Posted by: Admin</span>
            </div>
        </div>
    `).join('');
}

// ========== MODALS ==========
function showAddStudentModal() {
    // Implement modal logic
    alert('Add Student modal - to be implemented');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}