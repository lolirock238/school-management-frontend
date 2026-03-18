// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null, token = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers,
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API call failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ========== AUTH APIs ==========
async function login(username, password, role) {
    return apiCall('/auth/login', 'POST', { username, password, role });
}

// ========== STUDENT APIs ==========
async function getStudents() {
    return apiCall('/api/students');
}

async function getStudent(id) {
    return apiCall(`/api/students/${id}`);
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

// ========== TEACHER APIs ==========
async function getTeachers() {
    return apiCall('/api/teachers');
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

// ========== PARENT APIs ==========
async function getParentChildren(parentId) {
    return apiCall(`/api/parent/${parentId}/children`);
}

// ========== CLASS APIs ==========
async function getClasses() {
    return apiCall('/api/classes');
}

// ========== SUBJECT APIs ==========
async function getSubjects() {
    return apiCall('/api/subjects');
}

async function getSubjectsByClass(classId) {
    return apiCall(`/api/subjects/class/${classId}`);
}

// ========== DASHBOARD APIs ==========
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