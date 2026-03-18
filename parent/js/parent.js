// Get current parent ID
let currentParentId = null;
let parentChildren = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (user) {
        currentParentId = user.id;
        await loadParentDashboard();
        await loadParentChildren();
        await loadAnnouncements();
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
async function loadParentDashboard() {
    try {
        const children = await getParentChildren(currentParentId);
        parentChildren = children;
        
        document.getElementById('total-children').textContent = children.length;
        
        // Calculate total fees balance
        let totalBalance = 0;
        let totalAttendance = 0;
        let childrenWithAttendance = 0;
        
        children.forEach(child => {
            totalBalance += child.fee_balance || 0;
            if (child.attendance_percentage) {
                totalAttendance += child.attendance_percentage;
                childrenWithAttendance++;
            }
        });
        
        document.getElementById('total-fees-balance').textContent = `KSh ${totalBalance.toLocaleString()}`;
        
        const avgAttendance = childrenWithAttendance > 0 
            ? Math.round(totalAttendance / childrenWithAttendance) 
            : 0;
        document.getElementById('avg-attendance').textContent = avgAttendance + '%';
        
        // Load children summary
        const summaryList = document.getElementById('children-summary');
        summaryList.innerHTML = children.map(child => `
            <div class="child-summary-item">
                <div class="child-summary-avatar">${child.name.charAt(0)}</div>
                <div class="child-summary-info">
                    <div class="child-summary-name">${child.name}</div>
                    <div class="child-summary-class">${child.class || 'No class'}</div>
                </div>
                <div class="child-summary-stats">
                    <span title="Fee Balance">KSh ${child.fee_balance?.toLocaleString() || 0}</span>
                </div>
            </div>
        `).join('');
        
        // Load recent payments (placeholder for now)
        const recentPayments = document.getElementById('recent-payments');
        recentPayments.innerHTML = '<p>No recent payments</p>';
        
        // Load upcoming fees
        const upcomingFees = document.getElementById('upcoming-fees');
        upcomingFees.innerHTML = '<p>No upcoming fees</p>';
        
        // Count new announcements (placeholder)
        document.getElementById('new-announcements').textContent = '3';
        
    } catch (error) {
        console.error('Error loading parent dashboard:', error);
    }
}

// ========== CHILDREN ==========
async function loadParentChildren() {
    try {
        const children = await getParentChildren(currentParentId);
        parentChildren = children;
        
        // Load children grid
        const grid = document.getElementById('children-grid');
        
        if (!children || children.length === 0) {
            grid.innerHTML = '<p>No children found</p>';
            return;
        }
        
        grid.innerHTML = children.map(child => `
            <div class="child-card">
                <div class="child-header">
                    <div class="child-avatar">${child.name.charAt(0)}</div>
                    <div class="child-info">
                        <h3>${child.name}</h3>
                        <p>Adm: ${child.admission || 'N/A'} • ${child.class || 'No class'}</p>
                    </div>
                </div>
                <div class="child-body">
                    <div class="child-stats">
                        <div class="child-stat">
                            <span class="label">Attendance</span>
                            <span class="value">${child.attendance_percentage || 0}%</span>
                        </div>
                        <div class="child-stat">
                            <span class="label">Fee Balance</span>
                            <span class="value">KSh ${child.fee_balance?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                    <div class="child-stats">
                        <div class="child-stat">
                            <span class="label">Grades</span>
                            <span class="value">${child.grades?.length || 0}</span>
                        </div>
                        <div class="child-stat">
                            <span class="label">Courseworks</span>
                            <span class="value">${child.courseworks?.length || 0}</span>
                        </div>
                    </div>
                </div>
                <div class="child-footer">
                    <button onclick="selectChildForFees(${child.id}, '${child.name}')" class="btn-small">View Fees</button>
                    <button onclick="selectChildForGrades(${child.id}, '${child.name}')" class="btn-small">View Grades</button>
                    <button onclick="selectChildForAttendance(${child.id}, '${child.name}')" class="btn-small">Attendance</button>
                </div>
            </div>
        `).join('');
        
        // Populate all child selectors
        populateChildSelectors(children);
        
    } catch (error) {
        console.error('Error loading children:', error);
    }
}

function populateChildSelectors(children) {
    const selectors = [
        'fee-child-select',
        'grade-child-select', 
        'attendance-child-select',
        'payment-child'
    ];
    
    selectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (select) {
            select.innerHTML = '<option value="">Choose a child</option>';
            children.forEach(child => {
                select.innerHTML += `<option value="${child.id}">${child.name} (${child.class || 'No class'})</option>`;
            });
        }
    });
}

// ========== FEES ==========
async function selectChildForFees(childId, childName) {
    document.getElementById('fee-child-select').value = childId;
    showContent('fees-content');
    await loadChildFees(childId);
}

async function loadChildFees(childId = null) {
    const selectedId = childId || document.getElementById('fee-child-select').value;
    
    if (!selectedId) {
        document.getElementById('child-fees-container').style.display = 'none';
        return;
    }
    
    try {
        // Find child data
        const child = parentChildren.find(c => c.id == selectedId);
        
        if (!child) return;
        
        // Update container title
        document.getElementById('child-fees-container').style.display = 'block';
        
        // Update summary
        document.getElementById('child-fee-balance').textContent = `KSh ${child.fee_balance?.toLocaleString() || 0}`;
        
        // For demo purposes, create sample fee data
        const fees = [
            {
                term: 'Term 1 2024',
                total_amount: 50000,
                paid_amount: child.fee_balance ? 50000 - child.fee_balance : 30000,
                balance: child.fee_balance || 20000,
                status: child.fee_balance ? 'partial' : 'paid',
                due_date: '2024-02-15'
            },
            {
                term: 'Term 2 2024',
                total_amount: 50000,
                paid_amount: 0,
                balance: 50000,
                status: 'pending',
                due_date: '2024-05-15'
            }
        ];
        
        // Calculate totals
        const totalFees = fees.reduce((sum, f) => sum + f.total_amount, 0);
        const totalPaid = fees.reduce((sum, f) => sum + f.paid_amount, 0);
        
        document.getElementById('child-total-fees').textContent = `KSh ${totalFees.toLocaleString()}`;
        document.getElementById('child-total-paid').textContent = `KSh ${totalPaid.toLocaleString()}`;
        
        // Find next due
        const pendingFees = fees.filter(f => f.balance > 0);
        if (pendingFees.length > 0) {
            const nextDue = pendingFees.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
            document.getElementById('child-next-due').textContent = new Date(nextDue.due_date).toLocaleDateString();
        }
        
        // Load fees table
        const tbody = document.getElementById('child-fees-table-body');
        tbody.innerHTML = fees.map(f => `
            <tr>
                <td>${f.term}</td>
                <td>KSh ${f.total_amount.toLocaleString()}</td>
                <td>KSh ${f.paid_amount.toLocaleString()}</td>
                <td>KSh ${f.balance.toLocaleString()}</td>
                <td><span class="status-badge ${f.status}">${f.status}</span></td>
                <td>${new Date(f.due_date).toLocaleDateString()}</td>
            </tr>
        `).join('');
        
        // Load payment history (placeholder)
        const paymentBody = document.getElementById('child-payment-history-body');
        if (totalPaid > 0) {
            paymentBody.innerHTML = `
                <tr>
                    <td>2024-01-15</td>
                    <td>KSh 30,000</td>
                    <td>M-Pesa</td>
                    <td>MPESA123456</td>
                </tr>
            `;
        } else {
            paymentBody.innerHTML = '<tr><td colspan="4" class="text-center">No payment history</td></tr>';
        }
        
        // Populate payment term dropdown
        const termSelect = document.getElementById('payment-term');
        if (termSelect) {
            termSelect.innerHTML = '<option value="">Select Term</option>';
            fees.forEach((f, index) => {
                if (f.balance > 0) {
                    termSelect.innerHTML += `<option value="${index}" data-balance="${f.balance}">${f.term} (Balance: KSh ${f.balance})</option>`;
                }
            });
        }
        
    } catch (error) {
        console.error('Error loading child fees:', error);
    }
}

// ========== GRADES ==========
async function selectChildForGrades(childId, childName) {
    document.getElementById('grade-child-select').value = childId;
    showContent('grades-content');
    await loadChildGrades(childId);
}

async function loadChildGrades(childId = null) {
    const selectedId = childId || document.getElementById('grade-child-select').value;
    
    if (!selectedId) {
        document.getElementById('child-grades-container').style.display = 'none';
        return;
    }
    
    try {
        // Find child data
        const child = parentChildren.find(c => c.id == selectedId);
        
        if (!child) return;
        
        document.getElementById('child-grades-container').style.display = 'block';
        
        // Sample grades data
        const grades = [
            { subject: 'Mathematics', title: 'Algebra Test', marks: 85, total: 100, feedback: 'Good work!' },
            { subject: 'English', title: 'Essay', marks: 78, total: 100, feedback: 'Well written' },
            { subject: 'Kiswahili', title: 'Insha', marks: 92, total: 100, feedback: 'Excellent!' },
            { subject: 'Science', title: 'Physics CAT', marks: 88, total: 100, feedback: 'Great understanding' }
        ];
        
        // Calculate average
        const totalPercentage = grades.reduce((sum, g) => sum + (g.marks / g.total * 100), 0);
        const average = Math.round(totalPercentage / grades.length);
        document.getElementById('child-overall-average').textContent = average + '%';
        
        // Find best subject
        let bestSubject = '-';
        let bestScore = 0;
        grades.forEach(g => {
            const score = (g.marks / g.total) * 100;
            if (score > bestScore) {
                bestScore = score;
                bestSubject = g.subject;
            }
        });
        document.getElementById('child-best-subject').textContent = bestSubject;
        document.getElementById('child-total-courseworks').textContent = grades.length;
        
        // Load grades table
        const tbody = document.getElementById('child-grades-table-body');
        tbody.innerHTML = grades.map(g => {
            const percentage = Math.round((g.marks / g.total) * 100);
            let gradeClass = 'grade-badge ';
            if (percentage >= 80) gradeClass += 'A';
            else if (percentage >= 70) gradeClass += 'B';
            else if (percentage >= 60) gradeClass += 'C';
            else if (percentage >= 50) gradeClass += 'D';
            else gradeClass += 'E';
            
            let grade = percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'E';
            
            return `
            <tr>
                <td>${g.subject}</td>
                <td>${g.title}</td>
                <td>${g.marks}/${g.total} (${percentage}%)</td>
                <td><span class="${gradeClass}">${grade}</span></td>
                <td>${g.feedback}</td>
            </tr>
        `}).join('');
        
    } catch (error) {
        console.error('Error loading child grades:', error);
    }
}

// ========== ATTENDANCE ==========
async function selectChildForAttendance(childId, childName) {
    document.getElementById('attendance-child-select').value = childId;
    showContent('attendance-content');
    await loadChildAttendance(childId);
}

async function loadChildAttendance(childId = null) {
    const selectedId = childId || document.getElementById('attendance-child-select').value;
    
    if (!selectedId) {
        document.getElementById('child-attendance-container').style.display = 'none';
        return;
    }
    
    try {
        // Find child data
        const child = parentChildren.find(c => c.id == selectedId);
        
        if (!child) return;
        
        document.getElementById('child-attendance-container').style.display = 'block';
        
        // Sample attendance data
        const total = 20;
        const present = Math.floor(Math.random() * 5) + 15; // 15-19
        const absent = total - present;
        const percentage = Math.round((present / total) * 100);
        
        document.getElementById('child-attendance-percent').textContent = percentage + '%';
        document.getElementById('child-attendance-present').textContent = present;
        document.getElementById('child-attendance-absent').textContent = absent;
        document.getElementById('child-attendance-late').textContent = 2;
        document.getElementById('child-attendance-total').textContent = total;
        
        // Update circle chart
        const circle = document.getElementById('child-attendance-circle');
        const degrees = (percentage / 100) * 360;
        circle.style.background = `conic-gradient(#27ae60 ${degrees}deg, #e74c3c 0deg)`;
        
        // Load calendar
        loadAttendanceCalendar(selectedId);
        
    } catch (error) {
        console.error('Error loading child attendance:', error);
    }
}

function loadAttendanceCalendar(childId) {
    const calendar = document.getElementById('child-attendance-calendar');
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
    
    // Sample attendance statuses for demo
    const statuses = ['present', 'present', 'present', 'absent', 'present', 'present', 'late', 'present', 'present', 'present', 'absent', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'present'];
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const status = d <= statuses.length ? statuses[d-1] : '';
        html += `<div class="calendar-date ${status}">${d}</div>`;
    }
    
    calendar.innerHTML = html;
}

// ========== ANNOUNCEMENTS ==========
async function loadAnnouncements() {
    try {
        // Sample announcements
        const announcements = [
            {
                title: 'School Closed for Holidays',
                content: 'School will be closed from 20th December to 5th January for Christmas break. School reopens on 6th January.',
                date: '2024-12-10',
                target: 'All Parents',
                author: 'Administration'
            },
            {
                title: 'Parents Day Meeting',
                content: 'Annual Parents Day will be held on 15th March. Please confirm your attendance with the class teacher.',
                date: '2024-02-20',
                target: 'Parents Only',
                author: 'Academic Office'
            },
            {
                title: 'Fee Payment Deadline',
                content: 'Second term fees should be paid by 15th May. Late payment will attract a penalty.',
                date: '2024-04-01',
                target: 'All Parents',
                author: 'Finance Department'
            },
            {
                title: 'Sports Day',
                content: 'Annual Sports Day will be held on 10th June. Parents are invited to attend.',
                date: '2024-05-15',
                target: 'All Parents',
                author: 'Sports Department'
            }
        ];
        
        displayAnnouncements(announcements);
        
    } catch (error) {
        console.error('Error loading announcements:', error);
    }
}

function displayAnnouncements(announcements) {
    const container = document.getElementById('announcements-list');
    
    container.innerHTML = announcements.map(a => `
        <div class="announcement-card">
            <div class="announcement-header">
                <span class="announcement-title">${a.title}</span>
                <span class="announcement-date">${new Date(a.date).toLocaleDateString()}</span>
            </div>
            <div class="announcement-content">
                ${a.content}
            </div>
            <div class="announcement-footer">
                <span class="announcement-target">${a.target}</span>
                <span>Posted by: ${a.author}</span>
            </div>
        </div>
    `).join('');
}

function filterAnnouncements(type) {
    // Update active filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // For demo, just reload with same data
    loadAnnouncements();
}

// ========== PAYMENT MODAL ==========
function showMakePaymentModal() {
    // Ensure child selector is populated
    const childSelect = document.getElementById('payment-child');
    childSelect.innerHTML = '<option value="">Choose a child</option>';
    
    parentChildren.forEach(child => {
        childSelect.innerHTML += `<option value="${child.id}">${child.name} (${child.class || 'No class'})</option>`;
    });
    
    document.getElementById('payment-modal').style.display = 'block';
}

document.getElementById('payment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const childId = document.getElementById('payment-child').value;
    const termIndex = document.getElementById('payment-term').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const method = document.getElementById('payment-method').value;
    const transactionId = document.getElementById('transaction-id').value;
    
    if (!childId) {
        alert('Please select a child');
        return;
    }
    
    if (!termIndex) {
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
    
    // Simulate payment processing
    alert(`Payment of KSh ${amount} processed successfully!`);
    closeModal('payment-modal');
    
    // Refresh fees for the selected child
    await loadChildFees(childId);
});

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

// Update payment term dropdown based on selected child
document.getElementById('payment-child')?.addEventListener('change', async function() {
    const childId = this.value;
    if (childId) {
        await loadChildFees(childId);
    }
});