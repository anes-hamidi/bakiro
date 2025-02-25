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
            awaiting_validation: 'bg-secondary',
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
    async function generateOrderInvoice(orderId) {
        try {
            const orderDoc = await db.collection('orders').doc(orderId).get();
            if (!orderDoc.exists) {
                showToast('Order not found', 'danger');
                return;
            }
    
            const order = orderDoc.data();
            const userDoc = await db.collection('users').doc(order.userId).get();
            const user = userDoc.data();
          
            

    
            const totalPaid = await fetchPaymentDetails(order.userId);
            const remainingBalance = order.total - totalPaid;
    
            const invoiceHTML = `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 2rem auto; padding: 2.5rem; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    <div style="border-bottom: 2px solid #f0f2f5; padding-bottom: 1.5rem; margin-bottom: 2rem;">
                        <div style="display: flex; justify-content: space-between; align-items-center; margin-bottom: 1.5rem;">
                            <h1 style="color: #2f3542; font-size: 2rem; margin: 0; font-weight: 600;">Millora Distribution</h1>
                            <div style="color: #747d8c; font-size: 0.9rem;">Invoice ID: ${orderId}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                            <div>
                                <h3 style="color: #57606f; margin: 0 0 0.5rem; font-size: 0.9rem; font-weight: 500;">BILL TO</h3>
                                <p style="margin: 0.25rem 0; color: #2f3542;">${user.name}<br>${user.email}<br>${user.phone}</p>
                            </div>
                            <div>
                                <h3 style="color: #57606f; margin: 0 0 0.5rem; font-size: 0.9rem; font-weight: 500;">OUR INFO</h3>
                                <p style="margin: 0.25rem 0; color: #2f3542;">
                                    Millora Distribution<br>
                                    123 Main Street, Algiers, Algeria<br>
                                    Website: www.millora.com<br>
                                    WhatsApp: +213 987 654 321
                                </p>
                            </div>
                        </div>
                    </div>
                    <div style="margin-bottom: 2rem;">
                        <h3 style="color: #2f3542; font-size: 1.25rem; margin-bottom: 1rem;">Order Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                                    <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6;">Quantity</th>
                                    <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6;">Unit Price</th>
                                    <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">${item.name}</td>
                                        <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #dee2e6;">${item.quantity}</td>
                                        <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #dee2e6;">DZ ${item.unitPrice.toFixed(2)}</td>
                                        <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #dee2e6;">DZ ${(item.unitPrice * item.quantity).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2rem;">
                        <div>
                            <h3 style="color: #2f3542; font-size: 1.25rem; margin-bottom: 1rem;">Summary</h3>
                            <p style="margin: 0.25rem 0; color: #2f3542;">Order Total: DZ ${order.total.toFixed(2)}</p>
                            <p style="margin: 0.25rem 0; color: #2f3542;">Total Paid: DZ ${totalPaid.toFixed(2)}</p>
                            <p style="margin: 0.25rem 0; color: #2f3542;">Remaining Balance: DZ ${remainingBalance.toFixed(2)}</p>
                        </div>
                    </div>
                    <div style="text-align: center; color: #2f3542; font-size: 0.9rem;">
                        <p>Thank you for your business!</p>
                        <p>If you have any questions, please contact us at www.millora.com or WhatsApp: +213 987 654 321</p>
                    </div>
                </div>
            `;
    
            const invoiceWindow = window.open('', 'Invoice', 'width=800,height=600');
            invoiceWindow.document.write(invoiceHTML);
            invoiceWindow.document.close();
            invoiceWindow.print();
        } catch (error) {
            showToast('Error generating invoice: ' + error.message, 'danger');
            console.error('Error generating invoice:', error);
        }
    }
     


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
                                   aria-label="Order status"
                ${['completed', 'cancelled'].includes(order.status) ? 'disabled' : ''}>
          ${getStatusOptions(order.status).map(opt => `
            <option value="${opt.value}" ${order.status === opt.value ? 'selected' : ''}>
              ${opt.label}
            </option>
          `).join('')} </select>
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
         
<button class="btn btn-outline-success" onclick="showPaymentModal('${doc.id}')">
    Record Payment
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
// Generate invoice

function getStatusOptions(currentStatus) {
    const options = [];
    switch (currentStatus) {
      case 'awaiting_validation':
        options.push(
            {value: currentStatus, label: 'validate'},

          { value: 'pending', label: 'Waiting' },
          { value: 'cancelled', label: 'Cancel' }
        );
        break;
      case 'pending':
        options.push(
            {value: currentStatus, label: 'Waiting'},
          { value: 'processing', label: 'Processing' },
          { value: 'completed', label: 'Complete' },
          { value: 'cancelled', label: 'Cancel' }
        );
        break;
      case 'processing':
        options.push(
            {value: currentStatus, label: 'Processing'},

          { value: 'completed', label: 'Complete' },
          { value: 'cancelled', label: 'Cancel' }
        );
        break;
      case 'completed':
      case 'cancelled':
        options.push({ 
          value: currentStatus, 
          label: 'Archive'
        });
        break;
      default:
        options.push({ value: currentStatus, label: 'Unknown Status' });
    }
    return options;
  }
  function viewCustomerDetails(userId) {
    const customerDetails = document.getElementById('customer-details');
    const customerOrders = document.getElementById('customer-orders');
    const customerPayments = document.getElementById('customer-payments');

    customerDetails.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    customerOrders.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    customerPayments.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';

    db.collection('users').doc(userId).get()
        .then(doc => {
            if (!doc.exists) {
                customerDetails.innerHTML = '<div class="alert alert-danger">Customer not found.</div>';
                return;
            }

            const user = doc.data();
            customerDetails.innerHTML = `
                <h5>${user.name}</h5>
                <p>Email: ${user.email}</p>
                <p>Phone: ${user.phone}</p>
            `;

            return Promise.all([
                db.collection('orders').where('userId', '==', userId).get(),
                db.collection('users').doc(userId).collection('payments').get()
            ]);
        })
        .then(([ordersSnapshot, paymentsSnapshot]) => {
            customerOrders.innerHTML = '<h6>Orders</h6>';
            if (ordersSnapshot.empty) {
                customerOrders.innerHTML += '<div class="alert alert-info">No orders found.</div>';
            } else {
                ordersSnapshot.forEach(doc => {
                    const order = doc.data();
                    customerOrders.innerHTML += `
                        <div class="list-group-item">
                            <h6>Order #${doc.id}</h6>
                            <p>Total: DZ ${order.total.toFixed(2)}</p>
                            <p>Status: ${order.status}</p>
                        </div>
                    `;
                });
            }

            customerPayments.innerHTML = '<h6>Payments</h6>';
            if (paymentsSnapshot.empty) {
                customerPayments.innerHTML += '<div class="alert alert-info">No payments found.</div>';
            } else {
                paymentsSnapshot.forEach(doc => {
                    const payment = doc.data();
                    customerPayments.innerHTML += `
                        <div class="list-group-item">
                            <p>Amount: DZ ${payment.amount.toFixed(2)}</p>
                            <p>Receiver: ${payment.receiver}</p>
                            <p>Date: ${payment.createdAt.toDate().toLocaleString()}</p>
                        </div>
                    `;
                });
            }

            new bootstrap.Modal(document.getElementById('customerDetailsModal')).show();
        })
        .catch(error => {
            console.error('Error loading customer details:', error);
            customerDetails.innerHTML = '<div class="alert alert-danger">Error loading customer details.</div>';
            customerOrders.innerHTML = '';
            customerPayments.innerHTML = '';
        });
}
