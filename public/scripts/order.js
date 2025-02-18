
document.getElementById('orders-tab').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('orders-content').classList.add('show', 'active');
    document.getElementById('products-content').classList.remove('show', 'active');
    e.target.classList.add('active');
    document.getElementById('products-tab').classList.remove('active');
    document.getElementById('product-form-card').style.display = 'none';

    loadAdminOrders();
});

document.getElementById('order-search').addEventListener('input', function(e) {
    loadAdminOrders(e.target.value);
});
function loadAdminOrders(searchTerm = '') {
    const user = auth.currentUser;
    const ordersList = document.getElementById('admin-orders-list');
    ordersList.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';

    db.collection('orders')
        .orderBy('createdAt', 'desc')
        .get()
        .then(async (querySnapshot) => {
            ordersList.innerHTML = '';

            if (querySnapshot.empty) {
                ordersList.innerHTML = '<div class="alert alert-info">No orders found.</div>';
                return;
            }

            let filteredDocs = querySnapshot.docs;
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                filteredDocs = querySnapshot.docs.filter(doc => {
                    const order = doc.data();
                    return (
                        doc.id.toLowerCase().includes(searchLower) ||
                        (order.userName?.toLowerCase() || '').includes(searchLower) ||
                        (order.status?.toLowerCase() || '').includes(searchLower)
                    );
                });
            }

            if (filteredDocs.length === 0) {
                ordersList.innerHTML = '<div class="alert alert-info">No orders match your search.</div>';
                return;
            }
            // Create an array of order processing promises
            const orderPromises = filteredDocs.map(async (doc) => {                const order = doc.data();
                const orderDate = order.createdAt.toDate().toLocaleDateString();
                const total = order.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
                
                // Fetch user details
               

                return `
                    <div class="list-group-item mb-3">
    <div class="d-flex justify-content-between">
        <div>
            <h6 class="mb-1">Order #${doc.id}</h6>
            <div class="text-muted small">
                ${orderDate} • 
                <span class="fw-medium">${order.userName}</span>
            </div>
        </div>
        <div class="text-end">
            <select class="form-select status-select ${getStatusBadgeClass(order.status)}" 
                    data-order-id="${doc.id}" 
                    aria-label="Order status">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
            <div class="fw-bold mt-1">DZ ${total.toFixed(2)}</div>
        </div>
    </div>
    <!-- Rest of the order details -->
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
</div>`;
            });

            // Wait for all user fetches to complete
            const ordersHtml = await Promise.all(orderPromises);
            ordersList.innerHTML = ordersHtml.join('');
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            ordersList.innerHTML = '<div class="alert alert-danger">Error loading orders.</div>';
        });
}
function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        db.collection('orders').doc(orderId).delete()
            .then(() => loadAdminOrders());
    }
}
// Helper function for notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    document.body.appendChild(toast);
    new bootstrap.Toast(toast, { autohide: true, delay: 3000 }).show();
    setTimeout(() => toast.remove(), 3500);
}
// Keep the existing deleteOrder and event listener code
function getStatusBadgeClass(status) {
    const classes = {
        pending: 'border-pending text-pending',
        processing: 'border-primary text-primary',
        completed: 'border-success text-success',
        cancelled: 'border-danger text-danger'
    };
    return classes[status] || 'border-secondary text-secondary';
}
document.getElementById('admin-orders-list').addEventListener('change', (e) => {
    if (e.target.classList.contains('status-select')) {
        const orderId = e.target.dataset.orderId;
        const newStatus = e.target.value;
        updateOrderStatus(orderId, newStatus);
        loadAdminOrders();
    }
});
async function updateOrderStatus(orderId, newStatus) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast(`Order status updated to ${newStatus}`, 'success');
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error updating order status', 'danger');
        // Revert the UI if update fails
        e.target.value = previousStatus;
    }
}
