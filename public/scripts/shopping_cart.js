let cart = JSON.parse(localStorage.getItem('cart')) || [];
// Add to cart function
function addToCart(productId, unitPrice, maxQuantity, userName) {
    const quantityInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(quantityInput.value);

    if (isNaN(quantity) || quantity < 1 || quantity > maxQuantity) {
        alert(`Please enter a valid quantity between 1 and ${maxQuantity}`);
        return;
    }

    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            productId: productId,
            quantity: quantity,
            unitPrice: unitPrice,
            name: document.querySelector(`#qty-${productId}`).closest('.card').querySelector('.card-title').innerText
        });
    }

    updateCartStorage();
    updateCartDisplay();
    new bootstrap.Modal(document.getElementById('cartModal')).show();
}
// Update cart display
function updateCartDisplay() {
    const cartBody = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    let total = 0;

    cartBody.innerHTML = '';
    
    cart.forEach((item, index) => {
        const itemTotal = item.unitPrice * item.quantity;
        total += itemTotal;

        // JavaScript code to add items to cart
// JavaScript code to add items to cart
cartBody.innerHTML += `
<div class="cart-item">
    <div class="item-info">
        <div class="item-details">
            <div class="item-name">${item.name}</div>
            <div class="item-price">$${item.unitPrice.toFixed(2)} each</div>
        </div>
        <div class="quantity-control">
            <input type="number" 
                   value="${item.quantity}" 
                   min="1" 
                   class="quantity-input"
                   data-index="${index}"
                   aria-label="Quantity for ${item.name}">
        </div>
    </div>
    
    <div class="action-section">
        <div class="item-total">$${itemTotal.toFixed(2)}</div>
        <button class="remove-btn" 
                onclick="removeFromCart(${index})"
                aria-label="Remove ${item.name}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" width="18">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            <span class="remove-text">Remove</span>
        </button>
    </div>
</div>`;
    });

    cartTotal.textContent = total.toFixed(2);

    // Add quantity change listeners
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = e.target.dataset.index;
            const newQuantity = parseInt(e.target.value);
            
            if (newQuantity > 0) {
                cart[index].quantity = newQuantity;
                updateCartStorage();
                updateCartDisplay();
            }
        });
    });
}
function closeCartModal() {
    const cartModal = document.getElementById('cartModal');
    const modal = bootstrap.Modal.getInstance(cartModal);
    if (modal) {
        modal.hide();
    }
    
    // Optional: Add any cleanup logic here
    // Example: save cart state
    
    // Optional: Refresh product listings if needed
    loadUserProducts();
}
function updateCartStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}
// Checkout function
// Modified checkout function
async function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert('Please log in to checkout');
        return;
    }

    try {
        // Get user document to fetch name
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userName = userDoc.exists ? userDoc.data().name : 'Unknown User';

        const order = {
            userId: user.uid,
            userName: userName,  // Add user's name to order
            items: cart,
            total: parseFloat(document.getElementById('cart-total').textContent),
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const batch = db.batch();
        const orderRef = db.collection('orders').doc();
        
        batch.set(orderRef, order);
        
        cart.forEach(item => {
            const productRef = db.collection('products').doc(item.productId);
            batch.update(productRef, {
                quantity: firebase.firestore.FieldValue.increment(-item.quantity)
            });
        });

        await batch.commit();
        alert('Order placed successfully!');
        cart = [];
        removeFromCart();
        updateCartStorage();
        loadUserProducts();
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Error placing order: ' + error.message);
    }
}
function viewCart() {
    updateCartDisplay();
    new bootstrap.Modal(document.getElementById('cartModal')).show();
}
function closeCartModal() {
    

    new bootstrap.Modal(document.getElementById('cartModal')).hide();
}
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartStorage();
    updateCartDisplay();
}