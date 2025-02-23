 
 document.getElementById('payment-search').addEventListener('input', () => {
    loadPayments();
});

 function loadAdminOrders(searchTerm = '') {
    const ordersList = document.getElementById('admin-orders-list');
    ordersList.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';

    db.collection('orders')
        .orderBy('createdAt', 'desc')
        .get()
        .then(querySnapshot => {
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

            filteredDocs.forEach( async doc =>  {
                const order = doc.data();
                const orderDate = order.createdAt.toDate().toLocaleDateString();
                const total = order.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
                const userDoc = await db.collection('users').doc(order.userId).get();
                const userName = userDoc.exists ? userDoc.data().name : 'Unknown User';
                ordersList.innerHTML += `
                    <div class="list-group-item mb-3">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="mb-1">Order #${doc.id}</h6>
                                <div class="text-muted small">
                                    ${orderDate} • 
                                    <span class="fw-medium">${userName}</span>
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
                            <div class="mt-2">
                                <button class="btn btn-sm btn-outline-danger" 
                                    type="button" 
                                    onclick="deleteOrder('${doc.id}')">
                                    Delete Order
                                </button>
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