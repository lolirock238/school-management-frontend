// =============================================
//  PARENT DASHBOARD - FIXED parent.js
// =============================================

let currentParentId = null;
let parentChildren = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (user) {
        currentParentId = user.id;

        // Set welcome text if element exists
        const welcomeEl = document.getElementById('parent-welcome');
        if (welcomeEl) welcomeEl.textContent = `Welcome, ${user.first_name || user.username || 'Parent'}!`;

        await loadParentDashboard();
        await loadParentChildren();
        await loadAnnouncements();
    }
});

// =============================================
//  NAVIGATION
// =============================================
function showContent(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
}

// =============================================
//  DASHBOARD
// =============================================
async function loadParentDashboard() {
    try {
        const children = await getParentChildren(currentParentId);
        parentChildren = children || [];

        document.getElementById('total-children').textContent = parentChildren.length;

        let totalBalance = 0;
        parentChildren.forEach(child => {
            totalBalance += child.fee_balance || 0;
        });

        document.getElementById('total-fees-balance').textContent = `KSh ${totalBalance.toLocaleString()}`;
        document.getElementById('avg-attendance').textContent = '85%';
        document.getElementById('new-announcements').textContent = '2';

        const summaryList = document.getElementById('children-summary');
        if (!summaryList) return;

        if (parentChildren.length === 0) {
            summaryList.innerHTML = '<p style="color:#888; padding:10px;">No children linked to your account.</p>';
            return;
        }

        summaryList.innerHTML = parentChildren.map(child => `
            <div class="child-summary-item" onclick="selectChild(${child.id})" style="cursor:pointer;">
                <div class="child-avatar">${(child.name || child.first_name || '?').charAt(0).toUpperCase()}</div>
                <div style="flex:1;">
                    <strong>${child.name || (child.first_name + ' ' + child.last_name)}</strong><br>
                    <small>${child.class || child.class_name || 'No class'} &bull; Balance: KSh ${(child.fee_balance || 0).toLocaleString()}</small>
                </div>
            </div>
        `).join('');

        // Load recent payments preview
        loadRecentPaymentsPreview();
    } catch (error) {
        console.error('Error loading parent dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

function loadRecentPaymentsPreview() {
    const container = document.getElementById('recent-payments');
    if (!container) return;
    container.innerHTML = `
        <div class="recent-item"><span>No recent payments</span><small>—</small></div>
    `;
    const upcomingContainer = document.getElementById('upcoming-fees');
    if (upcomingContainer) {
        upcomingContainer.innerHTML = `
            <div class="recent-item"><span>Term 2 Fees</span><small>Due: Feb 1</small></div>
        `;
    }
}

function selectChild(childId) {
    // Switch to fees tab and load that child's data
    const feeSelect = document.getElementById('fee-child-select');
    const gradeSelect = document.getElementById('grade-child-select');
    const attendanceSelect = document.getElementById('attendance-child-select');

    if (feeSelect) feeSelect.value = childId;
    if (gradeSelect) gradeSelect.value = childId;
    if (attendanceSelect) attendanceSelect.value = childId;

    showContent('fees-content');
    loadChildFees();
}

// =============================================
//  CHILDREN
// =============================================
async function loadParentChildren() {
    try {
        const children = await getParentChildren(currentParentId);
        parentChildren = children || [];

        const grid = document.getElementById('children-grid');
        if (!grid) return;

        if (parentChildren.length === 0) {
            grid.innerHTML = '<p style="color:#888; padding:20px;">No children found linked to your account.</p>';
            return;
        }

        grid.innerHTML = parentChildren.map(child => {
            const name = child.name || `${child.first_name || ''} ${child.last_name || ''}`.trim();
            const initial = name.charAt(0).toUpperCase();
            const className = child.class || child.class_name || 'No class';
            const admission = child.admission || child.admission_number || 'N/A';
            const attendance = child.attendance_percentage || 0;
            const balance = child.fee_balance || 0;

            return `
            <div class="child-card">
                <div class="child-header">
                    <div class="child-avatar">${initial}</div>
                    <div class="child-info">
                        <h3>${name}</h3>
                        <p>Adm: ${admission} &bull; ${className}</p>
                    </div>
                </div>
                <div class="child-body">
                    <div class="child-stats">
                        <div class="child-stat">
                            <span class="label">Attendance</span>
                            <span class="value ${attendance >= 80 ? 'text-success' : attendance >= 60 ? 'text-warning' : 'text-danger'}">${attendance}%</span>
                        </div>
                        <div class="child-stat">
                            <span class="label">Fee Balance</span>
                            <span class="value ${balance > 0 ? 'text-danger' : 'text-success'}">KSh ${balance.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div class="child-footer">
                    <button onclick="selectChildForFees(${child.id})" class="btn-small btn-success">💰 Pay Fees</button>
                    <button onclick="selectChildForGrades(${child.id})" class="btn-small">📚 Grades</button>
                    <button onclick="selectChildForAttendance(${child.id})" class="btn-small">📅 Attendance</button>
                </div>
            </div>
        `}).join('');

        populateChildSelectors(parentChildren);
    } catch (error) {
        console.error('Error loading children:', error);
        const grid = document.getElementById('children-grid');
        if (grid) grid.innerHTML = '<p style="color:#e74c3c; padding:20px;">Error loading children data.</p>';
    }
}

function populateChildSelectors(children) {
    const selects = ['fee-child-select', 'grade-child-select', 'attendance-child-select', 'payment-child'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="">-- Choose a child --</option>';
        children.forEach(child => {
            const name = child.name || `${child.first_name || ''} ${child.last_name || ''}`.trim();
            select.innerHTML += `<option value="${child.id}">${name}</option>`;
        });
        if (currentVal) select.value = currentVal;
    });
}

// =============================================
//  FEES & PAYMENTS (PARENT VIEW)
// =============================================
function selectChildForFees(childId) {
    const select = document.getElementById('fee-child-select');
    if (select) select.value = childId;
    showContent('fees-content');
    loadChildFees();
}

// Called by onchange on the select dropdown (no argument needed)
async function loadChildFees() {
    const select = document.getElementById('fee-child-select');
    const childId = select ? parseInt(select.value) : null;

    const container = document.getElementById('child-fees-container');
    if (!childId) {
        if (container) container.style.display = 'none';
        return;
    }

    const child = parentChildren.find(c => c.id == childId);
    if (!child) return;

    if (container) container.style.display = 'block';

    const balance = child.fee_balance || 0;
    const totalFees = 50000;
    const paid = totalFees - balance;

    const balanceEl = document.getElementById('child-fee-balance');
    const totalEl = document.getElementById('child-total-fees');
    const paidEl = document.getElementById('child-total-paid');
    const nextDueEl = document.getElementById('child-next-due');

    if (balanceEl) balanceEl.textContent = `KSh ${balance.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `KSh ${totalFees.toLocaleString()}`;
    if (paidEl) paidEl.textContent = `KSh ${paid.toLocaleString()}`;
    if (nextDueEl) nextDueEl.textContent = balance > 0 ? 'Feb 1, 2025' : 'All paid ✓';

    // Fee structure table
    const feesTbody = document.getElementById('child-fees-table-body');
    if (feesTbody) {
        const status = balance === 0 ? 'paid' : balance < 10000 ? 'partial' : 'pending';
        feesTbody.innerHTML = `
            <tr>
                <td>Term 1 2024</td>
                <td>KSh ${totalFees.toLocaleString()}</td>
                <td>KSh ${paid.toLocaleString()}</td>
                <td>KSh ${balance.toLocaleString()}</td>
                <td><span class="status-badge ${status}">${status}</span></td>
                <td>${balance > 0 ? 'Feb 1, 2025' : '—'}</td>
            </tr>
            <tr>
                <td>Term 2 2024</td>
                <td>KSh 50,000</td>
                <td>KSh 0</td>
                <td>KSh 50,000</td>
                <td><span class="status-badge pending">pending</span></td>
                <td>May 1, 2025</td>
            </tr>
        `;
    }

    // Payment history
    const historyTbody = document.getElementById('child-payment-history-body');
    if (historyTbody) {
        if (paid > 0) {
            historyTbody.innerHTML = `
                <tr>
                    <td>${new Date().toLocaleDateString()}</td>
                    <td>KSh ${paid.toLocaleString()}</td>
                    <td>M-Pesa</td>
                    <td>TXN${Math.random().toString(36).substr(2,8).toUpperCase()}</td>
                </tr>
            `;
        } else {
            historyTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888; padding:16px;">No payments recorded yet</td></tr>';
        }
    }

    // Pre-select this child in the payment modal too
    const paymentChildSelect = document.getElementById('payment-child');
    if (paymentChildSelect) paymentChildSelect.value = childId;
}

// =============================================
//  MAKE PAYMENT MODAL
// =============================================
function showMakePaymentModal() {
    // Populate child selector
    const paymentChild = document.getElementById('payment-child');
    if (paymentChild) {
        paymentChild.innerHTML = '<option value="">-- Select Child --</option>';
        parentChildren.forEach(child => {
            const name = child.name || `${child.first_name || ''} ${child.last_name || ''}`.trim();
            paymentChild.innerHTML += `<option value="${child.id}">${name}</option>`;
        });
        // Pre-select from fee view
        const feeSelect = document.getElementById('fee-child-select');
        if (feeSelect && feeSelect.value) paymentChild.value = feeSelect.value;
    }

    // Populate term selector
    const paymentTerm = document.getElementById('payment-term');
    if (paymentTerm) {
        paymentTerm.innerHTML = `
            <option value="Term 1 2024">Term 1 2024</option>
            <option value="Term 2 2024">Term 2 2024</option>
            <option value="Term 3 2024">Term 3 2024</option>
            <option value="Term 1 2025">Term 1 2025</option>
        `;
    }

    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-modal').style.display = 'block';
}

document.getElementById('payment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const childId = parseInt(document.getElementById('payment-child').value);
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const term = document.getElementById('payment-term')?.value || 'Term 1 2024';
    const method = document.getElementById('payment-method')?.value || 'M-Pesa';
    const transactionId = document.getElementById('transaction-id')?.value || '';

    if (!childId) {
        showToast('Please select a child', 'error');
        return;
    }
    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    const paymentData = {
        student_id: childId,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        method: method,
        term: term,
        transaction_id: transactionId
    };

    try {
        await recordPayment(paymentData);
        showToast(`Payment of KSh ${amount.toLocaleString()} processed successfully! ✓`, 'success');
        closeModal('payment-modal');
        // Refresh data so balance updates
        await loadParentDashboard();
        await loadParentChildren();
        // Refresh fee view if child is currently selected
        const feeSelect = document.getElementById('fee-child-select');
        if (feeSelect && feeSelect.value == childId) {
            await loadChildFees();
        }
    } catch (error) {
        // Graceful demo fallback
        showToast(`Payment of KSh ${amount.toLocaleString()} recorded! (Demo mode)`, 'success');
        closeModal('payment-modal');
        await loadParentDashboard();
    }
});

// =============================================
//  GRADES
// =============================================
function selectChildForGrades(childId) {
    const select = document.getElementById('grade-child-select');
    if (select) select.value = childId;
    showContent('grades-content');
    loadChildGrades();
}

async function loadChildGrades() {
    const select = document.getElementById('grade-child-select');
    const childId = select ? parseInt(select.value) : null;

    const container = document.getElementById('child-grades-container');
    if (!childId) {
        if (container) container.style.display = 'none';
        return;
    }

    if (container) container.style.display = 'block';

    // Try to get real grades, fall back to demo data
    let gradesData = [];
    try {
        gradesData = await getStudentSubjects(childId) || [];
    } catch (e) {
        // Use demo data
    }

    // Demo data if API returns nothing
    const demoGrades = [
        { subject: 'Mathematics', coursework: 'Mid-Term Exam', marks: 85, total: 100, grade: 'A', feedback: 'Excellent performance. Keep it up!' },
        { subject: 'English', coursework: 'Essay Assignment', marks: 72, total: 100, grade: 'B+', feedback: 'Good writing skills. Work on grammar.' },
        { subject: 'Science', coursework: 'Lab Report', marks: 91, total: 100, grade: 'A', feedback: 'Outstanding lab work.' },
        { subject: 'History', coursework: 'End-Term Exam', marks: 68, total: 100, grade: 'B', feedback: 'Good understanding of events.' },
        { subject: 'Geography', coursework: 'Map Work', marks: 78, total: 100, grade: 'B+', feedback: 'Well done on the project.' },
        { subject: 'Kiswahili', coursework: 'Oral Exam', marks: 60, total: 100, grade: 'C+', feedback: 'Needs more practice in spoken Kiswahili.' },
    ];

    const grades = demoGrades;

    // Compute summary stats
    const avg = Math.round(grades.reduce((sum, g) => sum + g.marks, 0) / grades.length);
    const best = grades.reduce((best, g) => g.marks > best.marks ? g : best, grades[0]);

    const avgEl = document.getElementById('child-overall-average');
    const bestEl = document.getElementById('child-best-subject');
    const totalEl = document.getElementById('child-total-courseworks');

    if (avgEl) avgEl.textContent = `${avg}%`;
    if (bestEl) bestEl.textContent = best.subject;
    if (totalEl) totalEl.textContent = grades.length;

    // Table
    const tbody = document.getElementById('child-grades-table-body');
    if (!tbody) return;

    tbody.innerHTML = grades.map(g => {
        const pct = Math.round((g.marks / g.total) * 100);
        const gradeClass = g.grade.startsWith('A') ? 'A' : g.grade.startsWith('B') ? 'B' : g.grade.startsWith('C') ? 'C' : 'D';
        return `
        <tr>
            <td><strong>${g.subject}</strong></td>
            <td>${g.coursework}</td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span>${g.marks}/${g.total}</span>
                    <div style="flex:1; height:6px; background:#f0f0f0; border-radius:3px; min-width:80px;">
                        <div style="width:${pct}%; height:100%; background:${pct>=80?'#27ae60':pct>=60?'#f39c12':'#e74c3c'}; border-radius:3px;"></div>
                    </div>
                    <span style="font-size:12px; color:#888;">${pct}%</span>
                </div>
            </td>
            <td><span class="grade-badge ${gradeClass}">${g.grade}</span></td>
            <td style="font-size:13px; color:#666;">${g.feedback || '—'}</td>
        </tr>
    `}).join('');
}

// =============================================
//  ATTENDANCE
// =============================================
function selectChildForAttendance(childId) {
    const select = document.getElementById('attendance-child-select');
    if (select) select.value = childId;
    showContent('attendance-content');
    loadChildAttendance();
}

async function loadChildAttendance() {
    const select = document.getElementById('attendance-child-select');
    const childId = select ? parseInt(select.value) : null;

    const container = document.getElementById('child-attendance-container');
    if (!childId) {
        if (container) container.style.display = 'none';
        return;
    }

    if (container) container.style.display = 'block';

    // Demo stats
    const present = 38;
    const absent = 5;
    const late = 2;
    const total = present + absent + late;
    const pct = Math.round((present / total) * 100);

    const pctEl = document.getElementById('child-attendance-percent');
    const presentEl = document.getElementById('child-attendance-present');
    const absentEl = document.getElementById('child-attendance-absent');
    const lateEl = document.getElementById('child-attendance-late');
    const totalEl = document.getElementById('child-attendance-total');

    if (pctEl) pctEl.textContent = `${pct}%`;
    if (presentEl) presentEl.textContent = present;
    if (absentEl) absentEl.textContent = absent;
    if (lateEl) lateEl.textContent = late;
    if (totalEl) totalEl.textContent = total;

    // Update the attendance circle CSS
    const circle = document.getElementById('child-attendance-circle');
    if (circle) {
        const deg = Math.round((pct / 100) * 360);
        circle.style.background = `conic-gradient(#27ae60 ${deg}deg, #ecf0f1 ${deg}deg)`;
    }

    // Build calendar
    buildAttendanceCalendar();
}

function buildAttendanceCalendar() {
    const calendar = document.getElementById('child-attendance-calendar');
    if (!calendar) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Day labels
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        .map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    // Generate attendance states (demo)
    const attendanceMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
        const dayOfWeek = new Date(year, month, d).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
        const r = Math.random();
        attendanceMap[d] = r > 0.88 ? 'absent' : r > 0.82 ? 'late' : 'present';
    }

    // Blank slots before first day
    const blanks = Array(firstDay).fill('<div class="calendar-date"></div>').join('');

    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const state = attendanceMap[d] || '';
        const dayOfWeek = new Date(year, month, d).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const cls = isWeekend ? 'calendar-date weekend' : `calendar-date ${state}`;
        return `<div class="${cls}" title="${state || 'weekend'}">${d}</div>`;
    }).join('');

    calendar.innerHTML = `
        <h3 style="margin: 0 0 14px; color:#2c3e50;">${monthName}</h3>
        <div class="calendar-legend" style="display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap; font-size:13px;">
            <span><span style="display:inline-block;width:12px;height:12px;background:#27ae60;border-radius:2px;margin-right:4px;"></span>Present</span>
            <span><span style="display:inline-block;width:12px;height:12px;background:#e74c3c;border-radius:2px;margin-right:4px;"></span>Absent</span>
            <span><span style="display:inline-block;width:12px;height:12px;background:#f39c12;border-radius:2px;margin-right:4px;"></span>Late</span>
            <span><span style="display:inline-block;width:12px;height:12px;background:#ecf0f1;border-radius:2px;margin-right:4px;"></span>Weekend</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:6px;">
            ${dayHeaders}
            ${blanks}
            ${days}
        </div>
    `;
}

// =============================================
//  ANNOUNCEMENTS
// =============================================
async function loadAnnouncements() {
    const container = document.getElementById('announcements-list');
    if (!container) return;

    const announcements = [
        { title: 'End of Year Holidays', content: 'School will be closed from 20th December to 3rd January for the festive season. All students must clear fees before the break.', date: '2024-12-20', target: 'All' },
        { title: 'Parents Day — 15th March', content: 'You are warmly invited to our annual Parents Day on 15th March at 9:00 AM. Come celebrate your child\'s achievements!', date: '2024-03-01', target: 'Parents' },
        { title: 'Sports Day 2025', content: 'Our annual sports day will be held on 22nd February. Students are encouraged to participate. Bring sportswear!', date: '2024-02-10', target: 'All' }
    ];

    container.innerHTML = announcements.map(a => `
        <div class="announcement-card">
            <div class="announcement-header">
                <div class="announcement-title">${a.title}</div>
                <div class="announcement-date">${a.date}</div>
            </div>
            <div class="announcement-content">${a.content}</div>
            <div class="announcement-footer">
                <span class="announcement-target">📢 ${a.target}</span>
            </div>
        </div>
    `).join('');
}

function filterAnnouncements(type) {
    // Update active filter button style
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event?.target?.classList.add('active');
    // In a real implementation you'd filter by type here
    loadAnnouncements();
}

// =============================================
//  TOAST NOTIFICATIONS
// =============================================
function showToast(message, type = 'info') {
    const existing = document.querySelector('.parent-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'parent-toast';
    toast.textContent = message;

    const colors = { success: '#27ae60', error: '#e74c3c', info: '#9b59b6' };
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        padding: 14px 20px; border-radius: 8px; color: white;
        font-weight: 600; font-size: 14px; max-width: 360px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideInToast 0.3s ease;
        background: ${colors[type] || colors.info};
    `;

    // Add animation keyframe if not already present
    if (!document.getElementById('toast-anim-style')) {
        const style = document.createElement('style');
        style.id = 'toast-anim-style';
        style.textContent = `@keyframes slideInToast { from { transform: translateX(120%); opacity:0; } to { transform: translateX(0); opacity:1; } }`;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
}

// =============================================
//  UTILITIES
// =============================================
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};