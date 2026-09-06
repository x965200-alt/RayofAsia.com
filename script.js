// --- User ID Generation ---
// සෑම User කෙනෙක්ටම වෙනම ID එකක් හදලා ඒක Local Storage එකේ Save කරනවා
let currentUserId = localStorage.getItem('rayAsiaUserId');
if (!currentUserId) {
    currentUserId = 'User-' + Math.floor(10000 + Math.random() * 90000); // උදා: User-58291
    localStorage.setItem('rayAsiaUserId', currentUserId);
}

// --- Loading Animation Logic ---
window.addEventListener('load', function() {
    setTimeout(function() {
        var loader = document.getElementById('loading-screen');
        if(loader) loader.style.opacity = '0';
        setTimeout(function() {
            if(loader) loader.style.display = 'none';
        }, 500); 
    }, 3000); 
    
    // Check Firebase and load chat
    checkFirebaseAndInitChat();
});

function showComingSoon() {
    var toast = document.getElementById("toast");
    if(toast) {
        toast.className = "show";
        setTimeout(function(){ 
            toast.className = toast.className.replace("show", ""); 
        }, 3000);
    }
}

// --- Firebase Live Chat Sync (Admin Reply පෙන්වීම) ---
let isChatListening = false;

function checkFirebaseAndInitChat() {
    if (window.firebaseDb && window.fbOnSnapshot) {
        initFirebaseChat();
    } else {
        setTimeout(checkFirebaseAndInitChat, 500);
    }
}

function initFirebaseChat() {
    if (isChatListening) return;
    isChatListening = true;

    // මෙම User ගේ පමණක් Messages ෆිල්ටර් කිරීම
    const q = window.fbQuery(
        window.fbCollection(window.firebaseDb, "messages"),
        window.fbWhere("userId", "==", currentUserId)
    );

    // Live Message Listener
    window.fbOnSnapshot(q, (snapshot) => {
        var chatBox = document.getElementById('chat-box');
        if(!chatBox) return;

        chatBox.innerHTML = '<div class="chat-msg-received">හෙලෝ! Ray Asia කස්ටමර් සපෝට් එකට සාදරයෙන් පිළිගන්නවා. ඔබට මොන වගේ සහයක්ද අවශ්‍ය?</div>';

        // වෙලාව අනුව පිළිවෙලට හැදීම
        let messages = [];
        snapshot.forEach(doc => {
            messages.push(doc.data());
        });

        messages.sort((a, b) => {
            let timeA = a.timestamp ? a.timestamp.toMillis() : Date.now();
            let timeB = b.timestamp ? b.timestamp.toMillis() : Date.now();
            return timeA - timeB;
        });

        // Chat Box එකට මැසේජ් ඇතුළත් කිරීම
        messages.forEach((msg) => {
            const msgDiv = document.createElement('div');
            // Admin එවන ඒවා වම් පැත්තේ (received), User යවන ඒවා දකුණු පැත්තේ (sent) පෙන්වයි.
            msgDiv.className = msg.sender === 'user' ? 'chat-msg-sent' : 'chat-msg-received';
            
            if(msg.type === 'text') {
                msgDiv.innerText = msg.content;
            }
            chatBox.appendChild(msgDiv);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// --- Master Save Function (For Text Only) ---
async function saveMessage(text) {
    if (window.firebaseDb && window.fbAddDoc) {
        try {
            await window.fbAddDoc(window.fbCollection(window.firebaseDb, "messages"), {
                userId: currentUserId, // අදාළ User ID එක යැවීම
                type: 'text',
                content: text,
                sender: 'user',
                timestamp: window.fbServerTimestamp()
            });
        } catch (e) {
            console.error("Firestore DB Error: ", e);
        }
    }
    triggerAutoReply();
}

function sendTextMessage() {
    var input = document.getElementById('chat-input');
    var text = input.value.trim();
    if(text !== "") {
        saveMessage(text);
        input.value = '';
    }
}

function handleEnter(e) {
    if(e.key === 'Enter') {
        sendTextMessage();
    }
}

// --- Auto Reply Logic ---
function triggerAutoReply() {
    const now = Date.now();
    const lastReplyTime = localStorage.getItem('lastAutoReplyTime');
    const twentyFourHours = 24 * 60 * 60 * 1000; 

    if (!lastReplyTime || isNaN(lastReplyTime) || (now - parseInt(lastReplyTime)) >= twentyFourHours) {
        localStorage.setItem('lastAutoReplyTime', now.toString());

        setTimeout(async function() {
            if (window.firebaseDb && window.fbAddDoc) {
                await window.fbAddDoc(window.fbCollection(window.firebaseDb, "messages"), {
                    userId: currentUserId, // Auto Reply එකත් Firebase එකට යැවීම (Admin ට පෙනීමට)
                    type: 'text',
                    content: "අපගේ සේවදායකයින් මේ මොහොතේ ඉතා කාර්යබහුල බැවින්, කරුණාකර ඔබගේ ගැටලුව මෙහි සඳහන් කරන්න. අපි හැකි ඉක්මනින් ඔබට පිළිතුරක් ලබා දීමට කටයුතු කරන්නෙමු.",
                    sender: 'support',
                    timestamp: window.fbServerTimestamp()
                });
            }
        }, 1000); 
    }
}

// --- Particles JS Background Animation ---
if(typeof particlesJS !== "undefined") {
    particlesJS("particles-js", {
        "particles": { 
            "number": { "value": 50, "density": { "enable": true, "value_area": 800 } }, 
            "color": { "value": "#00ffff" }, 
            "shape": { "type": "circle" }, 
            "opacity": { "value": 0.5 }, 
            "size": { "value": 3 }, 
            "line_linked": { "enable": true, "distance": 150, "color": "#00ffff", "opacity": 0.2, "width": 1 }, 
            "move": { "enable": true, "speed": 1, "direction": "none", "random": true, "out_mode": "out" } 
        },
        "interactivity": { 
            "detect_on": "canvas", 
            "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" } } 
        },
        "retina_detect": true
    });
}

// --- Navigation Functions ---
function hideAllViews() {
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('promo-view').style.display = 'none';
    document.getElementById('voice-view').style.display = 'none';
    
    var contactView = document.getElementById('contact-view');
    if(contactView) contactView.style.display = 'none';
}

function showPromoView() {
    hideAllViews();
    document.getElementById('promo-view').style.display = 'flex';
}

function showVoiceView() {
    hideAllViews();
    document.getElementById('voice-view').style.display = 'flex';
}

function showMainView() {
    hideAllViews();
    document.getElementById('main-view').style.display = 'flex';
    
    if (currentPlayingAudio) {
        var audio = document.getElementById('audio-' + currentPlayingAudio);
        if (audio) {
            audio.pause();
            resetAudio(currentPlayingAudio);
        }
    }
}

function showContactView() {
    hideAllViews();
    var contactView = document.getElementById('contact-view');
    if(contactView) contactView.style.display = 'flex';
}

function showChatView() {
    document.getElementById('chat-view').style.display = 'flex';
    var chatBox = document.getElementById('chat-box');
    if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function closeChatView() {
    document.getElementById('chat-view').style.display = 'none';
}

// --- Promo Code Copy ---
function copyCode(elementId, buttonElement) {
    var copyText = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(copyText).then(function() {
        var originalHTML = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        buttonElement.style.backgroundColor = "#00ffff";
        buttonElement.style.color = "#000";
        setTimeout(function() {
            buttonElement.innerHTML = originalHTML;
            buttonElement.style.backgroundColor = "#4a4a5a";
            buttonElement.style.color = "#fff";
        }, 2000);
    });
}

// --- Voice Feedback Logic ---
let currentPlayingAudio = null;

function toggleAudio(id) {
    var audio = document.getElementById('audio-' + id);
    var icon = document.getElementById('icon-' + id);

    if (currentPlayingAudio && currentPlayingAudio !== id) {
        var prevAudio = document.getElementById('audio-' + currentPlayingAudio);
        var prevIcon = document.getElementById('icon-' + currentPlayingAudio);
        if(prevAudio) prevAudio.pause();
        if(prevIcon) {
            prevIcon.classList.remove('fa-pause');
            prevIcon.classList.add('fa-play');
        }
    }

    if (audio.paused) {
        var playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                icon.classList.remove('fa-play');
                icon.classList.add('fa-pause');
                currentPlayingAudio = id;
            }).catch(error => {
                console.error("Audio playback failed:", error);
                alert("මෙම Online Editor එකේ Security නිසා Audio Play කළ නොහැක. කරුණාකර ෆයිල් එක Save කර Chrome හරහා විවෘත කරන්න.");
                resetAudio(id);
            });
        }
    } else {
        audio.pause();
        resetAudio(id);
    }
}

function updateProgress(id) {
    var audio = document.getElementById('audio-' + id);
    var progress = document.getElementById('progress-' + id);
    if (audio && audio.duration) {
        var percent = (audio.currentTime / audio.duration) * 100;
        if(progress) progress.value = percent;
    }
}

function seekAudio(id, element) {
    var audio = document.getElementById('audio-' + id);
    if (audio && audio.duration) {
        audio.currentTime = (element.value / 100) * audio.duration;
    }
}

function resetAudio(id) {
    var icon = document.getElementById('icon-' + id);
    var progress = document.getElementById('progress-' + id);
    if(icon) {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
    }
    if(progress && progress.value == 100) { progress.value = 0; }
    if (currentPlayingAudio === id) currentPlayingAudio = null;
}
