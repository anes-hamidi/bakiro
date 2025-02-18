// Login Form Submission
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => checkUserRole())
        .catch((error) => alert(error.message));
});

// Signup Form Submission
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                role: role
            });
        })
        .then(() => checkUserRole())
        .catch((error) => alert(error.message));
});

// Auth State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        checkUserRole();
    } else {
        showAuthScreen();
        document.getElementById('login-form').reset();
        document.getElementById('signup-form').reset();
    }
});


// Check User Role
function checkUserRole() {
    const user = auth.currentUser;
    if (user) {
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    userData.role === 'admin' 
                        ? showAdminDashboard() 
                        : showUserDashboard();
                }
            });
    }
}
function logout() {

    auth.signOut().then(() => showAuthScreen());
}
