let selectedUser = null;

// User Search Functionality

document.getElementById('user-search').addEventListener('input', async function(e) {
    const searchTerm = e.target.value.trim();
    const resultsContainer = document.getElementById('user-search-results');
    
    if (searchTerm.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }

    try {
        // Search by name
        const nameQuery = db.collection('users')
            .where('name', '>=', searchTerm)
            .where('name', '<=', searchTerm + '\uf8ff')
            .limit(5);

        // Search by ID (document ID)
        let idDoc = null;
        try {
            idDoc = await db.collection('users').doc(searchTerm).get();
        } catch (error) {
            console.log("Invalid document ID format");
        }

        const [nameSnapshot, idSnapshot] = await Promise.all([nameQuery.get(), idDoc]);
        const users = [];

        nameSnapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        if (idDoc?.exists) {
            users.push({ id: idDoc.id, ...idDoc.data() });
        }

        displayUserResults(users);
    } catch (error) {
        showToast('Error searching users: ' + error.message, 'danger');
    }
});
async function selectUser(user) {
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
    const date = document.getElementById('payment-date').value;

    if (isNaN(amount)) {
        showToast('Please enter a valid payment amount', 'warning');
        return;
    }

    try {
        // Add payment to user's subcollection
        await db.collection('users').doc(selectedUser.id).collection('payments').add({
            amount: amount,
            date: firebase.firestore.Timestamp.fromDate(new Date(date)),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Refresh financial data
        await loadFinancialData(selectedUser.id);
        showToast('Payment recorded successfully', 'success');
        document.getElementById('payment-form').reset();
    } catch (error) {
        showToast('Error recording payment: ' + error.message, 'danger');
        console.error('Error recording payment:', error);
    }
});

function clearUserSearch() {
    document.getElementById('user-search').value = '';
    document.getElementById('user-search-results').innerHTML = '';
    document.getElementById('selected-user-info').style.display = 'none';
    selectedUser = null;
}

// Update loadPayments to show all payments
function loadPayments() {
    const paymentsList = document.getElementById('admin-payments-list');
    paymentsList.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';

    db.collectionGroup('payments')
        .orderBy('date', 'desc')
        .get()
        .then(querySnapshot => {
            paymentsList.innerHTML = '';

            if (querySnapshot.empty) {
                paymentsList.innerHTML = '<div class="alert alert-info">No payments found</div>';
                return;
            }

            querySnapshot.forEach(doc => {
                const payment = doc.data();
                const userRef = doc.ref.parent.parent;
                
                paymentsList.innerHTML += `
                    <div class="list-group-item mb-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">Payment to ${userRef.id}</h6>
                                <small class="text-muted">
                                    ${payment.date.toDate().toLocaleDateString()} • 
                                    Amount: DZ ${payment.amount.toFixed(2)}
                                </small>
                            </div>
                            <small class="text-muted">
                                ${doc.id}
                            </small>
                        </div>
                    </div>
                `;
            });
        })
        .catch(error => {
            console.error('Error loading payments:', error);
            paymentsList.innerHTML = '<div class="alert alert-danger">Error loading payments</div>';
        });
}
document.getElementById('generate-qr').addEventListener('click', async () => {
    if (!selectedUser) {
      showToast('Please select a user first', 'warning');
      return;
    }
  
    const qrData = JSON.stringify({
      userId: selectedUser.id,
      system: "your-system-name" // Add any additional security checks
    });
  
    // Clear previous QR code
    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = '';
  
    // Generate new QR code
    QRCode.toCanvas(qrData, { width: 256 }, (error, canvas) => {
      if (error) {
        showToast('Error generating QR code', 'danger');
        return;
      }
      container.appendChild(canvas);
      new bootstrap.Modal('#qrModal').show();
    });
  });
  let scanner = null;

// Start QR Scanning
document.getElementById('scan-qr').addEventListener('click', () => {
  const scannerModal = new bootstrap.Modal('#scannerModal');
  const videoElement = document.getElementById('scannerVideo');

  scanner = new Instascan.Scanner({
    video: videoElement,
    mirror: false
  });

  scanner.addListener('scan', async (content) => {
    try {
      const qrData = JSON.parse(content);
      
      // Basic security validation
      if (!qrData.userId || qrData.system !== "your-system-name") {
        throw new Error('Invalid QR code');
      }

      const userDoc = await db.collection('users').doc(qrData.userId).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      scanner.stop();
      scannerModal.hide();
      selectUser({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
      showToast('Invalid QR code: ' + error.message, 'danger');
    }
  });

  Instascan.Camera.getCameras()
    .then(cameras => {
      if (cameras.length > 0) {
        scanner.start(cameras[0]);
        scannerModal.show();
      } else {
        showToast('No cameras found', 'warning');
      }
    })
    .catch(error => {
      showToast('Camera access error: ' + error, 'danger');
    });
});

// Stop scanner when modal closes
document.getElementById('scannerModal').addEventListener('hidden.bs.modal', () => {
  if (scanner) scanner.stop();
});