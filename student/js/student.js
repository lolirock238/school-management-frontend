// Get current student ID
let currentStudentId = null;
let studentData = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (user) {
        currentStudentId = user.id;
        await loadStudentData();
        await loadStudentDashboard();
        await loadStudentSubjects();
        await loadStudentCourseworks();
        await loadStudentAttendance();
        await loadStudentFees();
        await loadStudentGrades();
        await loadStudentTimetable();
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

// Load student basic data
async function loadStudentData() {
    try {
        studentData = await getStudent(currentStudentId);
        document.getElementById('student-welcome').textContent = `Welcome, ${studentData.first_name} ${studentData.last_name}!`;
        document.getElementById('student-info').textContent = `Class: ${studentData.class_name || 'Not assigned'} • Adm: ${studentData.admission_number}`;
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}

// ========== DASHBOARD ==========
async function loadStudentDashboard() {
    try {
        // Load subjects
        const subjects = await getStudentSubjects(currentStudentId);
        const subjectsList = document.getElementById('student-subjects-list');
        
        if (subjects && subjects.length > 0) {
            subjectsList.innerHTML = subjects.slice(0, 4).map(s => `
                <div class="mini-subject-item">
                    <span class="mini-subject-name">${s.name}</span>
                    <span class="mini-subject-teacher">${s.teacher_name || 'N/A'}</span>
                </div>
            `).join('');
        } else {
            subjectsList.innerHTML = '<p>No subjects assigned</p>';
        }
        
        // Load courseworks
        const courseworks = await getStudentCourseworks(currentStudentId);
        const pendingCourseworks = courseworks.filter(c => !c.submitted && new Date(c.due_date) > new Date()).length;
        document.getElementById('pending-courseworks').textContent = pendingCourseworks;
        
        const upcomingContainer = document.getElementById('upcoming-courseworks');
        const upcoming = courseworks
            .filter(c => !c.submitted && new Date(c.due_date) > new Date())
            .slice(0, 5);
        
        if (upcoming.length > 0) {
            upcomingContainer.innerHTML = upcoming.map(c => `
                <div class="recent-item">
                    <span class="item-name">${c.title}</span>
                    <span class="item-detail">Due: ${new Date(c.due_date).toLocaleDateString()}</span>
                </div>
            `).join('');
        } else {
            upcomingContainer.innerHTML = '<p>No upcoming courseworks</p>';
        }
        
        // Load attendance
        const attendance = await getStudentAttendance(currentStudentId);
        document.getElementById('attendance-percentage').textContent = attendance.percentage + '%';
        
        const recentAttendance = document.getElementById('recent-attendance');
        if (attendance.records && attendance.records.length > 0) {
            const last5 = attendance.records.slice(0, 5);
            recentAttendance.innerHTML = last5.map(a => `
                <div class="recent-item">
                    <span class="item-name">${new Date(a.date).toLocaleDateString()}</span>
                    <span class="item-detail status-${a.status.toLowerCase()}">${a.status}</span>
                </div>
            `).join('');
        } else {
            recentAttendance.innerHTML = '<p>No attendance records</p>';
        }
        
        // Load fees
        const fees = await getStudentFees(currentStudentId);
        document.getElementById('fee-balance').textContent = `KSh ${fees.total_balance.toLocaleString()}`;
        
        // Load grades
        const grades = await getStudentGrades ? await getStudentGrades(currentStudentId) : [];
        let avgGrade = 'N/A';
        if (grades.length > 0) {
            const total = grades.reduce((sum, g) => sum + g.marks_obtained, 0);
            avgGrade = (total / grades.length).toFixed(1);
        }
        document.getElementById('average-grade').textContent = avgGrade;
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ========== SUBJECTS ==========
async function loadStudentSubjects() {
    try {
        const subjects = await getStudentSubjects(currentStudentId);
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
                        <p><i>👨‍🏫</i> Teacher: ${s.teacher_name || 'Not assigned'}</p>
                        <p><i>📚</i> Courseworks: ${s.coursework_count || 0}</p>
                    </div>
                </div>
                <div class="subject-footer">
                    <button onclick="viewSubjectCourseworks(${s.id})" class="btn-small">View Courseworks</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

function viewSubjectCourseworks(subjectId) {
    showContent('courseworks-content');
    // Filter courseworks by subject
    filterStudentCourseworks('all', subjectId);
}

// ========== COURSEWORKS ==========
async function loadStudentCourseworks(filter = 'all', subjectId = null) {
    try {
        const courseworks = await getStudentCourseworks(currentStudentId);
        const container = document.getElementById('courseworks-grid');
        
        let filtered = courseworks;
        
        // Apply subject filter if provided
        if (subjectId) {
            filtered = filtered.filter(c => c.subject_id === subjectId);
        }
        
        // Apply status filter
        if (filter === 'pending') {
            filtered = filtered.filter(c => !c.submitted && new Date(c.due_date) > new Date());
        } else if (filter === 'submitted') {
            filtered = filtered.filter(c => c.submitted && !c.marks_obtained);
        } else if (filter === 'graded') {
            filtered = filtered.filter(c => c.marks_obtained);
        }
        
        if (!filtered || filtered.length === 0) {
            container.innerHTML = '<p>No courseworks found</p>';
            return;
        }
        
        container.innerHTML = filtered.map(c => {
            const dueDate = new Date(c.due_date);
            const isOverdue = !c.submitted && dueDate < new Date();
            
            let statusClass = 'status-pending';
            let statusText = 'Pending';
            
            if (c.submitted) {
                if (c.marks_obtained) {
                    statusClass = 'status-graded';
                    statusText = `Graded - ${c.marks_obtained}/${c.total_marks}`;
                } else {
                    statusClass = 'status-submitted';
                    statusText = 'Submitted';
                }
            } else if (isOverdue) {
                statusClass = 'status-late';
                statusText = 'Overdue';
            }
            
            return `
            <div class="coursework-card">
                <div class="coursework-header ${c.type.toLowerCase()}">
                    <span class="coursework-type">${c.type}</span>
                    <h3>${c.title}</h3>
                    <p class="coursework-subject">${c.subject_name}</p>
                </div>
                <div class="coursework-body">
                    <p class="coursework-description">${c.description || 'No description'}</p>
                    
                    <div class="coursework-meta">
                        <div class="meta-item">
                            <span class="label">Teacher</span>
                            <span class="value">${c.teacher_name}</span>
                        </div>
                        <div class="meta-item">
                            <span class="label">Due Date</span>
                            <span class="value ${isOverdue ? 'overdue' : ''}">
                                ${dueDate.toLocaleDateString()}
                            </span>
                        </div>
                        <div class="meta-item">
                            <span class="label">Total Marks</span>
                            <span class="value">${c.total_marks}</span>
                        </div>
                    </div>
                    
                    <div class="submission-status ${statusClass}">
                        ${statusText}
                    </div>
                    
                    ${c.feedback ? `
                        <div class="feedback-box">
                            <strong>Feedback:</strong>
                            <p>${c.feedback}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="coursework-footer">
                    ${!c.submitted ? `
                        <button onclick="showSubmitCourseworkModal(${c.id}, '${c.title}')" class="btn-small btn-primary">Submit</button>
                    ` : ''}
                    <button onclick="viewSubmission(${c.id})" class="btn-small">View Details</button>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('Error loading courseworks:', error);
    }
}

function filterStudentCourseworks(type, subjectId = null) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event) {
        event.target.classList.add('active');
    }
    
    loadStudentCourseworks(type, subjectId);
}

function showSubmitCourseworkModal(courseworkId, title) {
    document.getElementById('submit-modal-title').textContent = `Submit: ${title}`;
    document.getElementById('submit-coursework-form').dataset.courseworkId = courseworkId;
    document.getElementById('submit-coursework-modal').style.display = 'block';
}

document.getElementById('submit-coursework-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const courseworkId = e.target.dataset.courseworkId;
    const content = document.getElementById('submission-content').value;
    const fileInput = document.getElementById('submission-file');
    
    // In a real app, you'd handle file uploads differently
    const submissionData = {
        coursework_id: parseInt(courseworkId),
        student_id: currentStudentId,
        content: content,
        file_path: fileInput.files[0] ? fileInput.files[0].name : null
    };
    
    try {
        await submitCoursework(submissionData);
        closeModal('submit-coursework-modal');
        await loadStudentCourseworks();
        alert('Coursework submitted successfully!');
    } catch (error) {
        alert('Error submitting coursework: ' + error.message);
    }
});

function viewSubmission(courseworkId) {
    // Navigate to submission details or open modal
    alert('View submission details - to be implemented');
}

// ========== ATTENDANCE ==========
async function loadStudentAttendance() {
    try {
        const attendance = await getStudentAttendance(currentStudentId);
        
        // Update summary stats
        document.getElementById('attendance-circle-percent').textContent = attendance.percentage + '%';
        document.getElementById('attendance-present').textContent = attendance.present || 0;
        document.getElementById('attendance-absent').textContent = (attendance.total - attendance.present) || 0;
        document.getElementById('attendance-total').textContent = attendance.total || 0;
        
        // Update circle chart
        const circle = document.getElementById('attendance-circle');
        if (attendance.percentage) {
            const degrees = (attendance.percentage / 100) * 360;
            circle.style.background = `conic-gradient(#27ae60 ${degrees}deg, #e74c3c 0deg)`;
        }
        
        // Load calendar view
        loadAttendanceCalendar(attendance.records);
        
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

function loadAttendanceCalendar(records) {
    const calendar = document.getElementById('attendance-calendar');
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Create day headers
    let html = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
        html += '<div class="calendar-date empty"></div>';
    }
    
    // Add dates
    const recordsMap = {};
    if (records) {
        records.forEach(r => {
            const dateStr = r.date.split('T')[0];
            recordsMap[dateStr] = r.status.toLowerCase();
        });
    }
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const status = recordsMap[dateStr] || '';
        
        html += `<div class="calendar-date ${status}">${d}</div>`;
    }
    
    calendar.innerHTML = html;
}

// ========== FEES ==========
async function loadStudentFees() {
    try {
        const feesData = await getStudentFees(currentStudentId);
        
        // Update summary
        document.getElementById('total-fee-balance').textContent = `KSh ${feesData.total_balance.toLocaleString()}`;
        
        // Calculate totals
        let totalFees = 0;
        let totalPaid = 0;
        feesData.fees.forEach(f => {
            totalFees += f.total_amount;
            totalPaid += f.paid_amount;
        });
        
        document.getElementById('total-fees').textContent = `KSh ${totalFees.toLocaleString()}`;
        document.getElementById('total-paid').textContent = `KSh ${totalPaid.toLocaleString()}`;
        
        // Find next due date
        const pendingFees = feesData.fees.filter(f => f.balance > 0);
        if (pendingFees.length > 0) {
            const nextDue = pendingFees.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
            document.getElementById('next-due-date').textContent = nextDue.due_date ? new Date(nextDue.due_date).toLocaleDateString() : '-';
        }
        
        // Load fees table
        const tbody = document.getElementById('fees-table-body');
        tbody.innerHTML = feesData.fees.map(f => `
            <tr>
                <td>${f.term}</td>
                <td>KSh ${f.total_amount.toLocaleString()}</td>
                <td>KSh ${f.paid_amount.toLocaleString()}</td>
                <td>KSh ${f.balance.toLocaleString()}</td>
                <td><span class="status-badge ${f.status}">${f.status}</span></td>
                <td>${f.due_date ? new Date(f.due_date).toLocaleDateString() : '-'}</td>
            </tr>
        `).join('');
        
        // Load payment history
        const paymentBody = document.getElementById('payment-history-body');
        if (feesData.payment_history && feesData.payment_history.length > 0) {
            paymentBody.innerHTML = feesData.payment_history.map(p => `
                <tr>
                    <td>${new Date(p.date).toLocaleDateString()}</td>
                    <td>KSh ${p.amount.toLocaleString()}</td>
                    <td>${p.method}</td>
                    <td>${p.transaction_id || '-'}</td>
                </tr>
            `).join('');
        } else {
            paymentBody.innerHTML = '<tr><td colspan="4" class="text-center">No payment history</td></tr>';
        }
        
        // Populate payment term dropdown
        const termSelect = document.getElementById('payment-term');
        if (termSelect) {
            termSelect.innerHTML = '<option value="">Select Term</option>';
            feesData.fees.forEach(f => {
                if (f.balance > 0) {
                    termSelect.innerHTML += `<option value="${f.id}" data-balance="${f.balance}">${f.term} (Balance: KSh ${f.balance})</option>`;
                }
            });
        }
        
    } catch (error) {
        console.error('Error loading fees:', error);
    }
}

function showMakePaymentModal() {
    document.getElementById('payment-form').reset();
    document.getElementById('payment-modal').style.display = 'block';
}

document.getElementById('payment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const feeId = document.getElementById('payment-term').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const method = document.getElementById('payment-method').value;
    const transactionId = document.getElementById('transaction-id').value;
    
    if (!feeId) {
        alert('Please select a term');
        return;
    }
    
    // Get selected option to check balance
    const selected = document.getElementById('payment-term').selectedOptions[0];
    const maxBalance = parseFloat(selected.dataset.balance);
    
    if (amount > maxBalance) {
        alert(`Amount cannot exceed balance of KSh ${maxBalance}`);
        return;
    }
    
    const paymentData = {
        fee_id: parseInt(feeId),
        amount: amount,
        payment_method: method,
        transaction_id: transactionId || null
    };
    
    try {
        // In a real app, you'd call a payment API
        await recordPayment(paymentData);
        closeModal('payment-modal');
        await loadStudentFees();
        alert('Payment recorded successfully!');
    } catch (error) {
        alert('Error processing payment: ' + error.message);
    }
});

// ========== GRADES ==========
async function loadStudentGrades() {
    try {
        // For now, use exam results as grades
        // You might need a dedicated grades endpoint
        const courseworks = await getStudentCourseworks(currentStudentId);
        const graded = courseworks.filter(c => c.marks_obtained);
        
        const tbody = document.getElementById('grades-table-body');
        
        if (graded.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No grades available</td></tr>';
            return;
        }
        
        // Calculate overall average
        const totalMarks = graded.reduce((sum, c) => sum + c.marks_obtained, 0);
        const totalPossible = graded.reduce((sum, c) => sum + c.total_marks, 0);
        const average = totalPossible > 0 ? Math.round((totalMarks / totalPossible) * 100) : 0;
        
        document.getElementById('overall-average').textContent = average + '%';
        
        // Find best subject
        const subjectAverages = {};
        graded.forEach(c => {
            if (!subjectAverages[c.subject_name]) {
                subjectAverages[c.subject_name] = { total: 0, count: 0 };
            }
            subjectAverages[c.subject_name].total += (c.marks_obtained / c.total_marks) * 100;
            subjectAverages[c.subject_name].count++;
        });
        
        let bestSubject = '-';
        let bestScore = 0;
        Object.entries(subjectAverages).forEach(([subject, data]) => {
            const avg = data.total / data.count;
            if (avg > bestScore) {
                bestScore = avg;
                bestSubject = subject;
            }
        });
        document.getElementById('best-subject').textContent = bestSubject;
        
        tbody.innerHTML = graded.map(c => {
            const percentage = Math.round((c.marks_obtained / c.total_marks) * 100);
            let gradeClass = 'grade-badge ';
            if (percentage >= 80) gradeClass += 'A';
            else if (percentage >= 70) gradeClass += 'B';
            else if (percentage >= 60) gradeClass += 'C';
            else if (percentage >= 50) gradeClass += 'D';
            else gradeClass += 'E';
            
            return `
            <tr>
                <td>${c.subject_name}</td>
                <td>${c.title}</td>
                <td>${c.marks_obtained}/${c.total_marks} (${percentage}%)</td>
                <td><span class="${gradeClass}">${percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'E'}</span></td>
                <td>${c.feedback || '-'}</td>
            </tr>
        `}).join('');
        
    } catch (error) {
        console.error('Error loading grades:', error);
    }
}

// ========== TIMETABLE ==========
async function loadStudentTimetable() {
    try {
        // Get student's class first
        if (!studentData || !studentData.class_id) {
            document.getElementById('student-timetable-grid').innerHTML = '<p>No class assigned</p>';
            return;
        }
        
        // You might need a timetable by class endpoint
        // For now, use a placeholder
        const timetable = [
            { day: 'Monday', subject: 'Mathematics', time: '08:00 - 09:30', room: 'Room 101' },
            { day: 'Monday', subject: 'English', time: '09:45 - 11:15', room: 'Room 102' },
            { day: 'Tuesday', subject: 'Kiswahili', time: '08:00 - 09:30', room: 'Room 103' },
            { day: 'Tuesday', subject: 'Science', time: '09:45 - 11:15', room: 'Room 104' },
            { day: 'Wednesday', subject: 'Mathematics', time: '08:00 - 09:30', room: 'Room 101' },
            { day: 'Wednesday', subject: 'English', time: '09:45 - 11:15', room: 'Room 102' },
            { day: 'Thursday', subject: 'Kiswahili', time: '08:00 - 09:30', room: 'Room 103' },
            { day: 'Thursday', subject: 'Science', time: '09:45 - 11:15', room: 'Room 104' },
            { day: 'Friday', subject: 'Mathematics', time: '08:00 - 09:30', room: 'Room 101' },
            { day: 'Friday', subject: 'English', time: '09:45 - 11:15', room: 'Room 102' }
        ];
        
        const container = document.getElementById('student-timetable-grid');
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
                            <div class="slot-time">${slot.time}</div>
                            <div class="slot-room">${slot.room}</div>
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

// ========== UTILITIES ==========
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Click outside modal to close
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}
