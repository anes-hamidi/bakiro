function loadUserProfile() {
    const user = auth.currentUser;
    const userInfoDiv = document.getElementById('user-info');
    
    db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists) {
            const userData = doc.data();
            userInfoDiv.innerHTML = `
                <p class="mb-1"><strong>Name:</strong> ${userData.name}</p>
                <p class="mb-1"><strong>Email:</strong> ${userData.email}</p>
                <p class="mb-0"><strong>Member Since:</strong> ${new Date(user.metadata.creationTime).toLocaleDateString()}</p>
            `;
        }
    });
}

function loadUserOrders() {
    const user = auth.currentUser;
    const ordersList = document.getElementById('user-orders-list');
    ordersList.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';

    db.collection('orders')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(querySnapshot => {
            ordersList.innerHTML = '';
            
            if (querySnapshot.empty) {
                ordersList.innerHTML = '<div class="alert alert-info">No orders found.</div>';
                return;
            }

            querySnapshot.forEach(doc => {
                const order = doc.data();
                const orderDate = order.createdAt.toDate().toLocaleDateString();
                const total = order.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

                ordersList.innerHTML += `
                    <div class="list-group-item mb-3">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="mb-1">Order #${doc.id}</h6>
                                <small class="text-muted">${orderDate}</small>
                            </div>
                            <div class="text-end">
                                <span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span>
                                <div class="fw-bold">DZ ${total.toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="mt-2">
                            <button class="btn btn-sm btn-outline-primary" 
                                type="button" 
                                data-bs-toggle="collapse" 
                                data-bs-target="#orderDetails-${doc.id}">
                                View Details
                            </button>
                        </div>
                        <div class="collapse mt-2" id="orderDetails-${doc.id}">
                            <ul class="list-group list-group-flush">
                                ${order.items.map(item => `
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                         ${item.quantity}x ${item.name}
                                        <span>DZ ${(item.unitPrice * item.quantity).toFixed(2)}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            });
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            ordersList.innerHTML = '<div class="alert alert-danger">Error loading orders.</div>';
        });
}

function getStatusBadgeClass(status) {
    const classes = {
        pending: 'bg-warning text-dark',
        processing: 'bg-primary text-white',
        completed: 'bg-success text-white',
        cancelled: 'bg-danger text-white'
    };
    return classes[status] || 'bg-secondary';
}function showProductList() {
    document.getElementById('products-list').style.display = 'block';
    document.getElementById('profile-section').style.display = 'none';
    
    // Optional: Refresh products if needed
     loadUserProducts(); 
}