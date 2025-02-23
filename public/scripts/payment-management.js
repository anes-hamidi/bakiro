let selectedUser = null;

// User Search Fundocuctionality
document.getElementById('payment-search').addEventListener('input', loadPayments);
async function selectUser(user)  {
    selectedUser = user;
    document.getElementById('user-search').value = user.name;
    document.getElementById('user-search-results').innerHTML = '';
    document.getElementById('selected-user-info').style.display = 'block';
    
    // Display user info
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-id').textContent = user.id;
    // Load financial data
    await loadFinancialData(user.id);

}

function displayUserResults(users) {   

    const resultsContainer = document.getElementById('user-search-results');
    resultsContainer.innerHTML = '';

    if (users.length === 0) {
        resultsContainer.innerHTML = '<div class="list-group-item">No users found</div>';
        return;
    }

    users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'list-group-item list-group-item-action';
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${user.name}</strong><br>
                    <small class="text-muted">${user.email}</small>
                </div>
                <small class="text-muted">ID: ${user.id}</small>
            </div>
        `;
        div.onclick = () => selectUser(user);
        resultsContainer.appendChild(div);
    });
}



async function loadFinancialData(userID)  {
    const ordersList = document.getElementById('user-orders-list');
    ordersList.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
  
    ordersSnapshot = await db.collection('orders')
        .where('userId', '==', userID)
        .orderBy('createdAt', 'desc')
        .get()
        
        .catch(error => {
            console.error('Error loading orders:', error);
            ordersList.innerHTML = '<div class="alert alert-danger">Error loading orders.</div>';
        });
        const totalOrders = ordersSnapshot.docs.reduce((sum, doc) => {
            const order = doc.data();
            return sum + (order.total || order.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0));
        }, 0);

        // Calculate total payments
        const paymentsSnapshot = await db.collection('users')
            .doc(userID)
            .collection('payments')
            .get();

        const totalPaid = paymentsSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

        // Update display
        document.getElementById('total-orders').textContent = totalOrders.toFixed(2);
        document.getElementById('total-paid').textContent = totalPaid.toFixed(2);
        document.getElementById('remaining-balance').textContent = (totalOrders - totalPaid).toFixed(2);

        console.log('Total Orders:', totalOrders);
        console.log('Total Paid:', totalPaid);
        console.log('Remaining Balance:', totalOrders - totalPaid);
}

// Payment Form Submission
document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
        showToast('Please select a user first', 'warning');
        return;
    }

    const amount = parseFloat(document.getElementById('payment-amount').value);

    if (isNaN(amount)) {
        showToast('Please enter a valid payment amount', 'warning');
        return;
    }

    try {
        // Fetch current user's details
        const currentUser = firebase.auth().currentUser;
        const currentUserDoc = await db.collection('users').doc(currentUser.uid).get();
        const currentUserName = currentUserDoc.exists ? currentUserDoc.data().name : 'Unknown User';

        // Add payment to user's subcollection
        const paymentRef = await db.collection('users').doc(selectedUser.id).collection('payments').add({
            amount: amount,
            resiver: currentUserName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Refresh financial data
        await loadFinancialData(selectedUser.id);
        showToast('Payment recorded successfully', 'success');
        document.getElementById('payment-form').reset();
        generateInvoice(paymentRef.id, selectedUser, amount, currentUserName);

    }  catch (error) {
        showToast('Error recording payment: ' + error.message, 'danger');
        console.error('Error recording payment:', error);
    }
});
function generateInvoice(paymentId, user, amount, resiver) {
    const invoiceTemplate = `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 680px; margin: 2rem auto; padding: 2.5rem; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header Section -->
    <div style="border-bottom: 2px solid #f0f2f5; padding-bottom: 1.5rem; margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h1 style="color: #2f3542; font-size: 2rem; margin: 0; font-weight: 600;">INVOICE</h1>
            <div style="color: #747d8c; font-size: 0.9rem;">Date: ${new Date().toLocaleDateString()}</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
            <div>
                <h3 style="color: #57606f; margin: 0 0 0.5rem; font-size: 0.9rem; font-weight: 500;">BILL TO</h3>
                <p style="margin: 0.25rem 0; color: #2f3542;">${user.name}<br>
                ${user.email}</p>
            </div>
            <div>
                <h3 style="color: #57606f; margin: 0 0 0.5rem; font-size: 0.9rem; font-weight: 500;">PAYMENT DETAILS</h3>
                <p style="margin: 0.25rem 0; color: #2f3542;">
                    Invoice ID: ${paymentId}<br>
                    Receiver: ${resiver}
                </p>
            </div>
        </div>
    </div>

    <!-- Amount Highlight -->
    <div style="background: #f8f9fa; border-radius: 8px; padding: 1.5rem; margin: 2rem 0; text-align: center;">
        <div style="color: #57606f; font-size: 0.9rem; margin-bottom: 0.5rem;">Total Amount Due</div>
        <div style="color: #2ed573; font-size: 2rem; font-weight: 700;">DZ ${amount.toFixed(2)}</div>
    </div>

    <!-- Footer -->
    <div style="border-top: 2px solid #f0f2f5; padding-top: 1.5rem; text-align: center;">
        <p style="color: #747d8c; margin: 0.5rem 0; font-size: 0.9rem;">
            Thank you for your payment!<br>
            Please contact us if you have any questions
        </p>
    </div>
</div>`;

    const invoiceWindow = window.open('', 'Invoice', 'width=800,height=600');
    invoiceWindow.document.write(invoiceTemplate);
    invoiceWindow.document.close();
    invoiceWindow.print();
}
function clearUserSearch() {
    document.getElementById('user-search').value = '';
    document.getElementById('user-search-results').innerHTML = '';
    document.getElementById('selected-user-info').style.display = 'none';
    selectedUser = null;
    const paymentsList = document.getElementById('admin-payments-list');
    paymentsList.innerHTML = '';

}

// Update loadPayments to show all payments
// Update loadPayments to show all payments
async function loadPayments() {
    const paymentsList = document.getElementById('admin-payments-list');
    const searchTerm = document.getElementById('payment-search').value.trim().toLowerCase();

    paymentsList.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';

    try {
        // Get all payments
        const querySnapshot = await db.collectionGroup('payments')
            .orderBy('createdAt', 'desc')
            .get();

        // Prepare array to hold payments with user data
        const paymentsWithUsers = await Promise.all(
            querySnapshot.docs.map(async doc => {
                const payment = doc.data();
                const userRef = doc.ref.parent.parent;
                const userDoc = await userRef.get();
                return {
                    payment,
                    user: userDoc.data(),
                    id: doc.id,
                    createdAt: payment.createdAt.toDate()
                };
            })
        );

        // Filter payments based on search term
        const filteredPayments = paymentsWithUsers.filter(({ id, payment, user }) => {
            const searchFields = [
                id.toLowerCase(),
                (payment.resiver || '').toLowerCase(),
                (user.name || '').toLowerCase(),
                (user.email || '').toLowerCase(),
                (user.phone || '').toLowerCase()
            ];
            return searchFields.some(field => field.includes(searchTerm));
        });

        paymentsList.innerHTML = '';

        if (filteredPayments.length === 0) {
            paymentsList.innerHTML = '<div class="alert alert-info">No payments found</div>';
            return;
        }

        // Display results
        filteredPayments.forEach(({ payment, user, createdAt }) => {
            paymentsList.innerHTML += `
                <div class="list-group-item mb-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">Customer ${user.name || 'Unknown User'}</h6>
                            <small class="text-muted">
                                • Amount: DZ <span style="font-weight: bold; color: #28a745;">${payment.amount.toFixed(2)}</span>
                                • Receiver: <span style="font-weight: bold; color:rgb(255, 0, 106);">${payment.resiver}</span>
                            </small>
                        </div>
                        <small class="text-muted"> • Payment Date:<span style="font-weight: bold; color: #007bff;">
                            ${createdAt.toLocaleString('en-GB', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                            })}</span>
                        </small>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error loading payments:', error);
        paymentsList.innerHTML = '<div class="alert alert-danger">Error loading payments</div>';
    }
}
function togglePaymentManagement() {
    const paymentsContent = document.getElementById('paymentM');
    const paymentsList = document.getElementById('payments-list-card');
    const toggleBtn = document.getElementById('payment-toggle');
    
    if (paymentsContent.style.display === 'none') {
        paymentsContent.style.display = 'block';
        paymentsList.style.display = 'none';  // Hide payments list when showing management
        toggleBtn.innerHTML = '<i class="bi bi-x fs-4"></i>';  // Change icon to X
    } else {
        paymentsContent.style.display = 'none';
        paymentsList.style.display = 'block';  // Show payments list when hiding management
        toggleBtn.innerHTML = '<i class="bi bi-credit-card fs-4"></i>';
    }
}