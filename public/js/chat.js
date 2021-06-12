const socket = io();

//elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationURLTemplate = document.querySelector(
  '#locationURL-template'
).innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  //new message element
  const $newMessage = $messages.lastElementChild;

  //height of new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // visible heigth
  const visibleHeigth = $newMessage.offsetHeight;

  //height of message container
  const containerHeigth = $messages.scrollHeight;

  //how far I have scrolled
  const scrollOfset = $messages.scrollTop + visibleHeigth;

  if (containerHeigth - newMessageHeight <= scrollOfset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    user: message.username,
    createdAt: moment(message.createdAt).format('h:mm a'),
    message: message.text,
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', (url) => {
  console.log(url);
  const html = Mustache.render(locationURLTemplate, {
    user: url.username,
    url: url.url,
    createdAt: moment(url.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');

  const message = e.target.elements.message.value;
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();
    if (error) return console.log(error);
    console.log('message delivered');
  });
});

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('geolocation is not supported by your browser');
  }

  $sendLocationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    const locationObj = {
      longitude: position.coords.longitude,
      latitude: position.coords.latitude,
    };
    socket.emit('sendLocation', locationObj, (error) => {
      $sendLocationButton.removeAttribute('disabled');
      if (error) return console.log(error);
      console.log('location shared!');
    });
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
