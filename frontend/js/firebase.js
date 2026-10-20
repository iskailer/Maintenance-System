import { initializeApp } from 
'https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js';

import { getAuth } from 
'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyBJKOa-BsVt0l85FEDrqLBe_UMmzCJFy2w",
    authDomain: "maintenance-system-225ca.firebaseapp.com",
    projectId: "maintenance-system-225ca",
    storageBucket: "maintenance-system-225ca.firebasestorage.app",
    messagingSenderId: "1071953176977",
    appId: "1:1071953176977:web:4d7cb0e95e72b1b9191230"
  };

  // Initialize Firebase
  const firebaseApp = initializeApp(firebaseConfig);

  export const auth = getAuth(firebaseApp);