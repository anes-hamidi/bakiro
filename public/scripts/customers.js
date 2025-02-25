document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('orders-tab').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('orders-content').classList.add('show', 'active');
        document.getElementById('products-content').classList.remove('show', 'active');
        document.getElementById('customers-content').classList.remove('show', 'active');
        e.target.classList.add('active');
        document.getElementById('products-tab').classList.remove('active');
        document.getElementById('customers-tab').classList.remove('active');

        loadAdminOrders();
    });

    document.getElementById('customers-tab').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('customers-content').classList.add('show', 'active');
        document.getElementById('orders-content').classList.remove('show', 'active');
        document.getElementById('products-content').classList.remove('show', 'active');
        e.target.classList.add('active');
        document.getElementById('orders-tab').classList.remove('active');
        document.getElementById('products-tab').classList.remove('active');

        loadAdminCustomers();
    });

    document.getElementById('order-search').addEventListener('input', function(e) {
        loadAdminOrders(e.target.value);
    });

    document.getElementById('customer-search').addEventListener('input', function(e) {
        loadAdminCustomers(e.target.value);
    });
});

function loadAdminCustomers(searchTerm = '') {
    const customersList = document.getElementById('admin-customers-list');
    customersList.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';

    db.collection('users')
        .orderBy('name')
        .get()
        .then(querySnapshot => {
            customersList.innerHTML = '';

            if (querySnapshot.empty) {
                customersList.innerHTML = '<div class="alert alert-info">No customers found.</div>';
                return;
            }

            let filteredDocs = querySnapshot.docs;
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                filteredDocs = querySnapshot.docs.filter(doc => {
                    const user = doc.data();
                    return (
                        doc.id.toLowerCase().includes(searchLower) ||
                        (user.name?.toLowerCase() || '').includes(searchLower) ||
                        (user.email?.toLowerCase() || '').includes(searchLower)
                    );
                });
            }

            if (filteredDocs.length === 0) {
                customersList.innerHTML = '<div class="alert alert-info">No customers match your search.</div>';
                return;
            }

            filteredDocs.forEach(async doc => {
                const user = doc.data();
                const userId = doc.id;
                const ordersSnapshot = await db.collection('orders').where('userId', '==', userId).get();
                const paymentsSnapshot = await db.collection('users').doc(userId).collection('payments').get();

                const totalOrders = ordersSnapshot.size;
                const totalPayments = paymentsSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
                const remaining = totalOrders - totalPayments;

                customersList.innerHTML += `
                    <div class="list-group-item mb-3">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="mb-1">${user.name}</h6>
                                <div class="text-muted small">
                                    ${user.email} • 
                                    <span class="fw-medium">Orders: ${totalOrders}</span> • 
                                    <span class="fw-medium">Payments: DZ ${totalPayments.toFixed(2)}</span>
                                                                        <span class="fw-medium">Remaining: DZ ${remaining.toFixed(2)}</span>

                                </div>
                            </div>
                            <div class="text-end">
                                <button class="btn btn-sm btn-outline-primary" 
                                    type="button" 
                                    onclick="viewCustomerDetails('${userId}')">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        })
        .catch(error => {
            console.error('Error loading customers:', error);
            customersList.innerHTML = '<div class="alert alert-danger">Error loading customers.</div>';
        });
}



// Generate sequential invoice numbers
let products = [];
let currentUserId = null;

async function showFactureForm(userId) {
    currentUserId = userId;
    const factureFormHTML = `
       <style>
    .invoice-form {
        font-family: 'Arial Arabic', 'Tahoma', sans-serif;
        max-width: 800px;
        margin: 2rem auto;
        padding: 2rem;
        background: #f8f9fa;
        border-radius: 10px;
        box-shadow: 0 2px 15px rgba(0,0,0,0.1);
        direction: rtl;
    }

    .form-section {
        background: white;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border-radius: 8px;
        border: 1px solid #eee;
    }

    .form-section h2 {
        color: #2c3e50;
        font-size: 1.3rem;
        margin-bottom: 1.2rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #3498db;
    }

    .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .required::after {
        content: "*";
        color: #e74c3c;
        margin-right: 5px;
    }

    input, select {
        width: 100%;
        padding: 0.8rem;
        border: 1px solid #ddd;
        border-radius: 5px;
        margin-top: 0.3rem;
    }

    .items-table {
        width: 100%;
        margin: 1rem 0;
        border-collapse: collapse;
    }

    .items-table th {
        background: #3498db;
        color: white;
        padding: 0.8rem;
    }

    .items-table td {
        padding: 0.6rem;
        border: 1px solid #eee;
    }

    .action-buttons {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    button {
        background: #3498db;
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 5px;
        cursor: pointer;
        transition: 0.3s;
    }

    button:hover {
        background: #2980b9;
    }

    @media (max-width: 768px) {
        .invoice-form {
            padding: 1rem;
        }
        
        .form-row {
            grid-template-columns: 1fr;
        }
    }
</style>

<form id="facture-form" class="invoice-form">
    <!-- Seller Information -->
    <div class="form-section">
        <h2>معلومات البائع</h2>
        <div class="form-row">
            <div>
                <label class="required">الاسم الكامل</label>
                <input type="text" id="seller-name" required>
            </div>
            <div>
                <label class="required">العنوان التجاري</label>
                <input type="text" id="seller-address" required>
            </div>
        </div>
        
        <div class="form-row">
            <div>
                <label class="required">رقم السجل التجاري</label>
                <input type="text" id="seller-reg-number" required>
            </div>
            <div>
                <label class="required">الرقم الإحصائي</label>
                <input type="text" id="seller-stat-number" required>
            </div>
            <div>
                <label>الشكل القانوني</label>
                <select id="seller-legal-form">
                    <option>شركة ذات مسؤولية محدودة</option>
                    <option>مؤسسة فردية</option>
                    <option>شركة مساهمة</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Buyer Information -->
    <div class="form-section">
        <h2>معلومات المشتري</h2>
        <div class="form-row">
            <div>
                <label class="required">اسم المشتري</label>
                <input type="text" id="buyer-name" required>
            </div>
            <div>
                <label>رقم السجل التجاري</label>
                <input type="text" id="buyer-reg-number">
            </div>
            <div>
                <label class="required">العنوان</label>
                <input type="text" id="buyer-address" required>
            </div>
        </div>
    </div>

    <!-- Invoice Details -->
    <div class="form-section">
        <h2>تفاصيل الفاتورة</h2>
        <div class="form-row">
            <div>
                <label class="required">رقم الفاتورة</label>
                <input type="text" id="invoice-number" required >
            </div>
            <div>
                <label class="required">تاريخ الفاتورة</label>
                <input type="date" id="invoice-date" required>
            </div>
        </div>
    </div>

    <!-- Items Table -->
    <div class="form-section">
        <h2>السلع/الخدمات</h2>
        <table class="items-table">
            <thead>
                <tr>
                    <th class="required">الوصف</th>
                    <th class="required">الكمية</th>
                    <th class="required">السعر</th>
                    <th class="required">المجموع</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="items-body">
                <!-- Dynamic rows -->
            </tbody>
        </table>
        <button type="button" onclick="addItem()">➕ إضافة صنف</button>
    </div>

    <!-- Totals -->
    <div class="form-section">
        <div class="form-row">
            <div>
                <label>ضريبة القيمة المضافة (%)</label>
                <input type="number" id="vat-rate" min="0" value="19">
            </div>
            <div>
                <label>الخصومات</label>
                <input type="number" id="discount" min="0">
            </div>
            <div>
                <label class="required">المجموع الكلي</label>
                <input type="number" id="total-amount" readonly>
            </div>
        </div>
    </div>

    <!-- Payment & Legal -->
    <div class="form-section">
        <div class="form-row">
            <div>
                <label class="required">طريقة الدفع</label>
                <select id="payment-method" required>
                    <option>نقدي</option>
                    <option>شيك</option>
                    <option>تحويل بنكي</option>
                </select>
            </div>
            <div>
                <label class="required">تاريخ الاستحقاق</label>
                <input type="date" id="due-date" required>
            </div>
        </div>
        
        <div class="form-row">
            <label>
                <input type="checkbox" id="compliance" required>
                أوافق على مطابقة البيانات لأحكام المرسوم 05-468
            </label>
        </div>
    </div>

    <div class="action-buttons">
        <button type="submit">💾 حفظ الفاتورة</button>
        <button type="button" onclick="resetForm()">🗑️ مسح النموذج</button>
    </div>
</form>
    `;
    const modalBody = document.querySelector('#customerDetailsModal .modal-body');
    modalBody.innerHTML = factureFormHTML;

    // Load products and user data in parallel
    const [userDoc, productsSnapshot] = await Promise.all([
        db.collection('users').doc(userId).get(),
        db.collection('products').get()
    ]);

    products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const userData = userDoc.data();

    // Pre-fill buyer information
    document.getElementById('buyer-name').value = userData.name || '';
    document.getElementById('buyer-address').value = userData.address || '';
    
    // Generate invoice number
    const invoiceNumber = await getNextInvoiceNumber();
    document.getElementById('invoice-number').value = invoiceNumber;
    
    // Initialize date fields
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoice-date').value = today;
    document.getElementById('due-date').value = today;

    // Initialize autocomplete
    initializeProductAutocomplete();

    // Add event listeners
    document.getElementById('facture-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveFactureInfo(userId);
    });

    new bootstrap.Modal(document.getElementById('customerDetailsModal')).show();
}

async function getNextInvoiceNumber() {
    const counterRef = db.collection('counters').doc('invoices');
    return db.runTransaction(async transaction => {
        const doc = await transaction.get(counterRef);
        const newNumber = (doc.exists ? doc.data().seq : 0) + 1;
        transaction.set(counterRef, { seq: newNumber }, { merge: true });
        return newNumber.toString().padStart(6, '0');
    });
}

function initializeProductAutocomplete() {
    const productSearch = document.getElementById('product-search');
    const productResults = document.getElementById('product-results');

    productSearch.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        productResults.innerHTML = products
            .filter(p => p.name.toLowerCase().includes(searchTerm))
            .map(p => `
                <div class="product-item" data-id="${p.id}" data-price="${p.price}">
                    ${p.name} - ${p.price.toFixed(2)} DZ
                </div>
            `).join('');
    });

    productResults.addEventListener('click', (e) => {
        if (e.target.classList.contains('product-item')) {
            addItemToTable(
                e.target.dataset.id,
                e.target.textContent.split(' - ')[0],
                parseFloat(e.target.dataset.price)
            );
            productSearch.value = '';
            productResults.innerHTML = '';
        }
    });
}

function addItemToTable(productId, productName, price) {
    const tbody = document.getElementById('items-body');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${productName} <input type="hidden" name="productId" value="${productId}"></td>
        <td><input type="number" min="1" value="1" class="form-control quantity"></td>
        <td><input type="number" value="${price.toFixed(2)}" class="form-control price" step="0.01"></td>
        <td class="total">${price.toFixed(2)}</td>
        <td><button type="button" class="btn btn-danger btn-sm remove-item">×</button></td>
    `;

    // Add event listeners for calculations
    const quantityInput = newRow.querySelector('.quantity');
    const priceInput = newRow.querySelector('.price');
    
    const updateRow = () => {
        const qty = parseFloat(quantityInput.value) || 0;
        const prc = parseFloat(priceInput.value) || 0;
        newRow.querySelector('.total').textContent = (qty * prc).toFixed(2);
        updateTotals();
    };

    quantityInput.addEventListener('input', updateRow);
    priceInput.addEventListener('input', updateRow);
    newRow.querySelector('.remove-item').addEventListener('click', () => {
        newRow.remove();
        updateTotals();
    });

    tbody.appendChild(newRow);
    updateTotals();
}

function updateTotals() {
    let subtotal = 0;
    document.querySelectorAll('#items-body tr').forEach(row => {
        subtotal += parseFloat(row.querySelector('.total').textContent) || 0;
    });

    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const vatRate = parseFloat(document.getElementById('vat-rate').value) || 0;

    const totalAfterDiscount = Math.max(subtotal - discount, 0);
    const vatAmount = totalAfterDiscount * (vatRate / 100);
    const grandTotal = totalAfterDiscount + vatAmount;

    document.getElementById('subtotal').value = subtotal.toFixed(2);
    document.getElementById('vat-amount').value = vatAmount.toFixed(2);
    document.getElementById('total-amount').value = grandTotal.toFixed(2);
}

async function saveFactureInfo(userId) {
    const factureData = {
        seller: {
            name: document.getElementById('seller-name').value,
            address: document.getElementById('seller-address').value,
            regNumber: document.getElementById('seller-reg-number').value,
            statNumber: document.getElementById('seller-stat-number').value,
            legalForm: document.getElementById('seller-legal-form').value,
        },
        buyer: {
            name: document.getElementById('buyer-name').value,
            address: document.getElementById('buyer-address').value,
            regNumber: document.getElementById('buyer-reg-number').value,
        },
        invoice: {
            number: document.getElementById('invoice-number').value,
            date: document.getElementById('invoice-date').value,
        },
        items: Array.from(document.querySelectorAll('#items-body tr')).map(row => ({
            productId: row.querySelector('[name="productId"]').value,
            description: row.cells[0].textContent.trim(),
            quantity: parseFloat(row.querySelector('.quantity').value),
            unitPrice: parseFloat(row.querySelector('.price').value),
            total: parseFloat(row.querySelector('.total').textContent),
        })),
        subtotal: parseFloat(document.getElementById('subtotal').value),
        discount: parseFloat(document.getElementById('discount').value),
        vatRate: parseFloat(document.getElementById('vat-rate').value),
        vatAmount: parseFloat(document.getElementById('vat-amount').value),
        totalAmount: parseFloat(document.getElementById('total-amount').value),
        payment: {
            method: document.getElementById('payment-method').value,
            dueDate: document.getElementById('due-date').value,
        },
        compliance: document.getElementById('compliance').checked,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
        await db.collection('users').doc(userId).collection('factures').add(factureData);
        showToast('Facture saved successfully!', 'success');
        loadAdminCustomers(); // Refresh customer list
        bootstrap.Modal.getInstance(document.getElementById('customerDetailsModal')).hide();
    } catch (error) {
        console.error('Error saving facture:', error);
        showToast('Error saving facture: ' + error.message, 'danger');
    }
}
