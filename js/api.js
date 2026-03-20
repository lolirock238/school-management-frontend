// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
    };

    // Attach token if stored (for when you add JWT auth later)
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `API error: ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error);
        throw error;
    }
}

// ========== AUTH ==========
async function login(username, password, role) {
    return apiCall('/auth/login', 'POST', {
        username,
        password,
        role: role.toUpperCase()
    });
}

// ========== STUDENTS ==========
async function getStudents() {
    return apiCall('/api/students');
}

async function getStudent(id) {
    return apiCall(`/api/students/${id}`);
}

async function createStudent(studentData) {
    return apiCall('/api/students', 'POST', studentData);
}

async function updateStudent(id, studentData) {
    return apiCall(`/api/students/${id}`, 'PUT', studentData);
}

async function deleteStudent(id) {
    return apiCall(`/api/students/${id}`, 'DELETE');
}

async function getStudentSubjects(studentId) {
    return apiCall(`/api/student/${studentId}/subjects`);
}

async function getStudentFees(studentId) {
    return apiCall(`/api/student/${studentId}/fees`);
}

async function getStudentAttendance(studentId) {
    return apiCall(`/api/student/${studentId}/attendance`);
}

async function getStudentCourseworks(studentId) {
    return apiCall(`/api/student/${studentId}/courseworks`);
}

async function submitCoursework(data) {
    return apiCall('/api/submit-coursework', 'POST', data);
}

// ========== TEACHERS ==========
async function getTeachers() {
    return apiCall('/api/teachers');
}

async function getTeacher(id) {
    return apiCall(`/api/teachers/${id}`);
}

async function createTeacher(teacherData) {
    return apiCall('/api/teachers', 'POST', teacherData);
}

async function updateTeacher(id, teacherData) {
    return apiCall(`/api/teachers/${id}`, 'PUT', teacherData);
}

async function deleteTeacher(id) {
    return apiCall(`/api/teachers/${id}`, 'DELETE');
}

async function getTeacherSubjects(teacherId) {
    return apiCall(`/api/teacher/${teacherId}/subjects`);
}

async function getTeacherCourseworks(teacherId) {
    return apiCall(`/api/teacher/${teacherId}/courseworks`);
}

async function createCoursework(data) {
    return apiCall('/api/create-coursework', 'POST', data);
}

async function getSubmissionsForGrading(teacherId, courseworkId) {
    return apiCall(`/api/teacher/${teacherId}/submissions/${courseworkId}`);
}

async function gradeSubmission(data) {
    return apiCall('/api/grade-submission', 'POST', data);
}

async function getTeacherTimetable(teacherId) {
    return apiCall(`/api/teacher/${teacherId}/timetable`);
}

// ========== PARENTS ==========
async function getParents() {
    return apiCall('/api/parents');
}

async function getParent(id) {
    return apiCall(`/api/parents/${id}`);
}

async function createParent(parentData) {
    return apiCall('/api/parents', 'POST', parentData);
}

async function updateParent(id, parentData) {
    return apiCall(`/api/parents/${id}`, 'PUT', parentData);
}

async function deleteParent(id) {
    return apiCall(`/api/parents/${id}`, 'DELETE');
}

async function getParentChildren(parentId) {
    return apiCall(`/api/parent/${parentId}/children`);
}

// ========== CLASSES ==========
async function getClasses() {
    return apiCall('/api/classes');
}

async function getClass(id) {
    return apiCall(`/api/classes/${id}`);
}

async function createClass(classData) {
    return apiCall('/api/classes', 'POST', classData);
}

async function updateClass(id, classData) {
    return apiCall(`/api/classes/${id}`, 'PUT', classData);
}

async function deleteClass(id) {
    return apiCall(`/api/classes/${id}`, 'DELETE');
}

// ========== SUBJECTS ==========
async function getSubjects() {
    return apiCall('/api/subjects');
}

async function getSubject(id) {
    return apiCall(`/api/subjects/${id}`);
}

async function createSubject(subjectData) {
    return apiCall('/api/subjects', 'POST', subjectData);
}

async function updateSubject(id, subjectData) {
    return apiCall(`/api/subjects/${id}`, 'PUT', subjectData);
}

async function deleteSubject(id) {
    return apiCall(`/api/subjects/${id}`, 'DELETE');
}

async function getSubjectsByClass(classId) {
    return apiCall(`/api/subjects/class/${classId}`);
}

// ========== FEES & PAYMENTS ==========
async function recordPayment(paymentData) {
    return apiCall('/api/payments', 'POST', paymentData);
}

async function getStudentPayments(studentId) {
    return apiCall(`/api/students/${studentId}/payments`);
}

// ========== DASHBOARD ==========
async function getDashboardStats() {
    return apiCall('/api/dashboard/stats');
}

async function getRecentStudents() {
    return apiCall('/api/dashboard/recent-students');
}

async function getUpcomingExams() {
    return apiCall('/api/dashboard/upcoming-exams');
}

async function getPendingFees() {
    return apiCall('/api/dashboard/pending-fees');
}

// ========== ANNOUNCEMENTS ==========
async function getAnnouncements(role = null) {
    const query = role ? `?role=${role}` : '';
    return apiCall(`/api/announcements${query}`);
}

async function createAnnouncement(data) {
    return apiCall('/api/announcements', 'POST', data);
}