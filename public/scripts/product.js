


document.getElementById('add-product-btn').addEventListener('click', () => {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('productModalLabel').textContent = 'Create New Product';
    new bootstrap.Modal(document.getElementById('productModal')).show();
});
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const productId = document.getElementById('product-id').value;
        const productName = document.getElementById('product-name').value;
        const productCapacity = document.getElementById('capacity').value;

        // Check if a product with the same name and capacity exists
        const querySnapshot = await db.collection('products')
            .where('name', '==', productName)
            .where('capacity', '==', productCapacity)
            .get();

        if (!querySnapshot.empty && !productId) {
            // Product with the same name and capacity exists
            const existingProduct = querySnapshot.docs[0];
            const existingProductId = existingProduct.id;

            // Display a message and button to edit the existing product
            showToast('Product found. Do you want to edit it?', 'warning');

            // Remove any existing "Edit Existing Product" button
            const existingEditButton = document.getElementById('edit-existing-product-btn');
            if (existingEditButton) {
                existingEditButton.remove();
            }

            // Create and append the new "Edit Existing Product" button
            const editButton = document.createElement('button');
            editButton.id = 'edit-existing-product-btn';
            editButton.className = 'btn btn-primary mt-2';
            editButton.textContent = 'Edit Existing Product';
            editButton.onclick = () => editProduct(existingProductId);
            document.getElementById('product-form').appendChild(editButton);
            return;
        }

        const product = {
            name: productName,
            capacity: productCapacity,
            flavor: document.getElementById('flavor').value,
            unitPrice: parseFloat(document.getElementById('unit-price').value),
            quantity: parseInt(document.getElementById('quantity').value),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (productId) {
            // Update existing product
            await db.collection('products').doc(productId).update(product);
            showToast('Product updated successfully', 'success');
        } else {
            // Create new product
            product.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(product);
            showToast('Product created successfully', 'success');
        }

        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = ''; // Clear the ID
        new bootstrap.Modal(document.getElementById('productModal')).hide();
        loadProducts();

        // Hide the modal
        const productModal = new bootstrap.Modal(document.getElementById('productModal'));
        productModal.hide();

    } catch (error) {
        showToast(`Error: ${error.message}`, 'danger');
        console.error(error);
    }
});

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
    setTimeout(() => toast.remove(), 1500);
}

function loadProducts(highlightProductId = null) {
        const productsList = document.getElementById('admin-products-list');
        productsList.innerHTML = '';    
        db.collection('products').orderBy('createdAt', 'desc').get()
            .then(querySnapshot => {
                querySnapshot.forEach(doc => {

                    const product = doc.data();
                    
                    const row = `
                    <div class="listtile  ${doc.id === highlightProductId ? 'highlight' : ''}" id="product-${doc.id}">
    <div class="listtile-content">
        <div class="listtile-leading">
            <div class="product-avatar">${product.name.charAt(0)}</div>
        </div>
        
        <div class="listtile-primary">
            <div class="listtile-title">${product.name}</div>
            <div class="listtile-subtitle">
               <span class="detail-value text-success">DZ ${product.unitPrice.toFixed(2)} </span>
               <span class="detail-value ${product.quantity > 0 ? 'text-black' : 'text-danger'}">
                    || ${product.quantity}
                </span>
            </div>
        </div>

        <div class="listtile-secondary">
            <div class="listtile-detail">
                <span class="detail-label">Capacity</span>
                <span class="detail-value">${product.capacity}</span>
            </div>
            <div class="listtile-detail">
                <span class="detail-label">Flavor</span>
                <span class="detail-value">${product.flavor || '-'}</span>
            </div>
            <div class="listtile-detail">
                 <span class="text-muted">Created: ${new Date(product.createdAt?.toDate()).toLocaleDateString()}</span>
            </div>
            
        </div>

       <div class="listtile-trailing">
            <button class="btn btn-icon text-primary" 
                    onclick="editProduct('${doc.id}')"
                    aria-label="Edit product">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-icon text-danger" 
                    onclick="deleteProduct('${doc.id}')"
                    aria-label="Delete product">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    </div>
</div>
                      
                    `;
                    productsList.innerHTML += row;
                }); if (highlightProductId) {
                    const highlightedElement = document.getElementById(`product-${highlightProductId}`);
                    if (highlightedElement) {
                        highlightedElement.scrollIntoView({ behavior: 'smooth' });
                        highlightedElement.classList.add('highlight');
                        setTimeout(() => highlightedElement.classList.remove('highlight'), 2000);
                    }
                }
            })
            .catch(error => alert(error.message));
}
function loadUserProducts() {
        const container = document.getElementById('products-list');
        container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border"></div></div>';
        db.collection('products').where('quantity', '>', 0).get()
            .then(querySnapshot => {
                container.innerHTML = '';
                if (querySnapshot.empty) {
                    container.innerHTML = '<div class="col-12 text-center">No products available</div>';
                    return;
                }
    
                querySnapshot.forEach(doc => {
                    const product = doc.data();
                    const productId = doc.id;
                    
                    container.innerHTML += `
                        <div class="col">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">${product.name}</h5>
                                    <div class="card-text">
                                        <div>Capacity: ${product.capacity}</div>
                                        <div>Flavor: ${product.flavor}</div>
                                        <div class="text-success">Price: $${product.unitPrice.toFixed(2)}</div>
                                        <div>Available: ${product.quantity}</div>
                                    </div>
                                    <div class="mt-3">
                                        <div class="input-group">
                                            <input type="number" 
                                                id="qty-${productId}"
                                                class="form-control" 
                                                value="1" 
                                                min="1" 
                                                max="${product.quantity}"
                                                aria-label="Quantity">
                                             <button class="btn btn-primary" 
                    onclick="addToCart('${productId}', ${product.unitPrice}, ${product.quantity}, '${product.name}')">
                    Add to Cart
                </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
            })
            .catch(error => {
                console.error('Error loading products:', error);
                container.innerHTML = `<div class="col-12 text-center text-danger">Error loading products: ${error.message}</div>`;
            });
}
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        await db.collection('products').doc(productId).delete();
        showToast('Product deleted successfully', 'success');
        loadProducts();
    } catch (error) {
        showToast(`Error deleting product: ${error.message}`, 'danger');
        console.error('Delete error:', error);
    }
}
async function editProduct(productId) {
    const doc = await db.collection('products').doc(productId).get();
    if (!doc.exists) return;

    const product = doc.data();
    const form = document.getElementById('product-form');
    
    // Set the product ID in hidden field
    document.getElementById('product-id').value = productId;
    
    // Populate form fields
    document.getElementById('product-name').value = product.name;
    document.getElementById('capacity').value = product.capacity;
    document.getElementById('flavor').value = product.flavor;
    document.getElementById('unit-price').value = product.unitPrice;
    document.getElementById('quantity').value = product.quantity;
    new bootstrap.Modal(document.getElementById('productModal')).show();

    // Change button text
   

}