var trackersAnnounceURLs = [
	'wss://tracker.openwebtorrent.com',
	'wss://tracker.sloppyta.co:443/announce',
	'wss://open.tube:443/tracker/socket',
	'ws://tracker.sloppyta.co:80/announce',
	'ws://tracker.btsync.cf:6969/announce',
];

const userSection = document.getElementById('user-section');
const saveUserName = document.getElementById('save-user-name');
const userName = document.getElementById('user-name');

const roomSection = document.getElementById('room-section');
const createNewRoom = document.getElementById('create-new-room');

const joinARoom = document.getElementById('join-a-room');
const joinRoomSection = document.getElementById('join-room-section');
const accessRoom = document.getElementById('access-room');
const roomIdToJoin = document.getElementById('room-id-to-join');

const chatSection = document.getElementById('chat-section');
const chatFrame = document.getElementById('chat-frame');
const roomIdConnected = document.getElementById('room-id-connected');
const sendMessage = document.getElementById('send-message');
const myMessage = document.getElementById('my-message');

const messageList = document.getElementById('message-list');

let myUserName;
let roomId;
let p2pt;
let peerNamesById = [];
let peers = [];

const ASK_USER_NAME_MESSAGE = '[GET_USER_NAME]';

main();

function main() {
	hideRoomSection();
	hideJoinRoomSection();
	hideChatSection();

	attachOnSaveUserNameClicked();
	attachOnNewRoom();
	attachOnJoinRoom();
  attachOnSendMessage();
}

function attachOnSendMessage() {
  sendMessage.addEventListener('click', onSendMessage);
}

function onSendMessage() {
  const messageToSend = getMessageToSend();
  sendMessageToRoom(messageToSend);
}

function sendMessageToRoom(message) {
  
  broadcastMessage(message);
  addMyMessageToMessageList(message);
  cleanMessageBox();
}

function cleanMessageBox() {
  myMessage.value = "";
}

function broadcastMessage(message) {
  for (let i = 0; i < peers.length; i++) {
    const peer = peers[i];
    try {
      p2pt.send(peer, message);
    } catch (error) {
    }
  }
}

function getMessageToSend() {
  return myMessage.value;
}

function attachOnNewRoom() {
	createNewRoom.addEventListener('click', onNewRoom);
}

function attachOnJoinRoom() {
	joinARoom.addEventListener('click', onJoinARoom);
}

function onJoinARoom() {
	hideRoomSection();
	showJoinRoomSection();
	attachOnAccessRoom();
}

function showJoinRoomSection() {
	joinRoomSection.style.display = 'block';
}

function hideJoinRoomSection() {
	joinRoomSection.style.display = 'none';
}

function attachOnAccessRoom() {
	accessRoom.addEventListener('click', onAccessRoom);
}

function onAccessRoom() {
	roomId = getRoomIdToJoin();
	enterToRoom();
}

function getRoomIdToJoin() {
	return roomIdToJoin.value;
}

function onNewRoom() {
	roomId = newRoomId();
	enterToRoom();
}

function enterToRoom() {
  roomIdConnected.innerHTML = roomId;
	hideRoomSection();
  hideJoinRoomSection();
	runChatRoom();
	showChatSection();
}

function showChatSection() {
	chatSection.style.display = 'block';
}

function hideChatSection() {
	chatSection.style.display = 'none';
}

function newRoomId() {
	return new Date().getTime();
}

function runChatRoom() {
	createP2PTInstance();

	attachOnTrackerConnected(onConnectionSuccess);
	attachOnMessageReceived();
	attachOnPeerConnected();
  attachOnPeerClose();

	startP2P();
}

function attachOnSaveUserNameClicked() {
	saveUserName.addEventListener('click', onSaveUserName);
}

function onSaveUserName() {
	myUserName = getUserNameEntered();
	hideUserSection();
	showRoomSection();
}

function getUserNameEntered() {
	return userName.value;
}

function hideUserSection() {
	userSection.style.display = 'none';
}

function showRoomSection() {
	roomSection.style.display = 'block';
}

function hideRoomSection() {
	roomSection.style.display = 'none';
}

function startP2P() {
	p2pt.start();
}

function createP2PTInstance() {
	p2pt = new P2PT(trackersAnnounceURLs, 'micro-chat-' + roomId);
}

function attachOnTrackerConnected(onConnectionSuccess) {
	p2pt.on('trackerconnect', onConnectionSuccess);
}

function onConnectionSuccess(tracker, stats) {
	console.log('Connected to tracker : ' + tracker.announceUrl);
	console.log('Tracker stats : ' + JSON.stringify(stats));
}

function attachOnPeerConnected() {
	p2pt.on('peerconnect', onPeerConnected);
}

function attachOnPeerClose() {
	p2pt.on('peerclose', onPeerClose);
}

function attachOnMessageReceived() {
	p2pt.on('msg', onMessageReceived);
}

function onMessageReceived(peer, msg) {
	if (msg === ASK_USER_NAME_MESSAGE) {
		peer.respond(myUserName);
		return;
	}

  showNewMessage(peer, msg);
}

function showNewMessage(peer, msg) {
  const fromName = getPeerName(peer);

  addMessageToMessageList(fromName, msg);
}

function getPeerName(peer) {
  return peerNamesById[peer.id];
}

function addMessageToMessageList(fromName, msg) {
  const messageHtml = createMessageElement(fromName, msg);
  appendNewMessage(messageHtml);
}

function appendNewMessage(messageHtml) {
  messageList.appendChild(messageHtml);
  scrollToBottom(chatFrame);
}

function addMyMessageToMessageList(msg) {
  const messageHtml = createMyMessageElement(msg);
  appendNewMessage(messageHtml);
}

function onPeerConnected(peer) {
	askPeerName(peer);
}

function onPeerClose(peer) {
  showNewMessage(peer, "..>> DISCONNECTED <<..");
	removePeerFromList(peer);
  removePeerFromNames(peer);
}

function removePeerFromList(peer) {

  const indexToRemove = findIndexForPeer(peer);

  if (indexToRemove >= 0){
    peers.splice(indexToRemove, 1);
  }

}

function findIndexForPeer(peerToFind) {
  let index = -1;

  for (let i = 0; i < peers.length; i++) {
    const peer = peers[i];
    if (peer.id == peerToFind.id) {
      index = i;
      break;
    }
  }

  return index;
}

function removePeerFromNames(peer) {
  delete peerNamesById[peer.id];
}

function askPeerName(peer) {
	p2pt.send(peer, ASK_USER_NAME_MESSAGE)
    .then(([peer, peerName]) => {
		peerNamesById[peer.id] = peerName;
    peers.push(peer);

    addMessageToMessageList(peerName, "..>> MEMBER <<..");
	});
}

function createMessageElement(fromName, msg) {
  const html = 
  `<li>
    <div class="msj macro">
      <div class="text text-r">
        <p>${msg}</p>
        <p><small>from ${fromName}</small></p>
      </div>
    </div>
  </li>`;

  return htmlToElement(html);
}

function createMyMessageElement(msg) {
  const html = 
  `<li>
    <div class="msj-rta macro">
      <div class="text text-r">
      <p>${msg}</p>
      <p></p>
      </div>
    </div>
  </li>`;

  return htmlToElement(html);
}


function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

function htmlToElements(html) {
  var template = document.createElement('template');
  template.innerHTML = html;
  return template.content.childNodes;
}

function scrollToBottom(scrollableElement) {
  scrollableElement.scrollTop =  scrollableElement.scrollHeight;
}
