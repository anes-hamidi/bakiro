document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('orders-tab').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('orders-content').classList.add('show', 'active');
        document.getElementById('products-content').classList.remove('show', 'active');
        e.target.classList.add('active');
        document.getElementById('products-tab').classList.remove('active');

        loadAdminOrders();
    });
});
    document.getElementById('order-search').addEventListener('input', function(e) {
        loadAdminOrders(e.target.value);
    });

  

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
        }
    }
