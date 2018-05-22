import './index.scss';
import axios from 'axios';

axios.defaults.validateStatus = () => true;

let authed = false;
const rootEl = document.querySelector('.root');
const postApi = axios.create({
  baseURL: process.env.API_BASE_URL,
});

function setAuth(token) {
  localStorage.setItem('token', token);
  postApi.defaults.headers['Authorization'] = `Bearer ${token}`;
  rootEl.classList.add('root--authed');
  authed = true;
}

function removeAuth() {
  localStorage.removeItem('token');
  delete postApi.defaults.headers['Authorization'];
  rootEl.classList.remove('root--authed');
  authed = false;
}

if (localStorage.getItem('token')) {
  setAuth(localStorage.getItem('token'));
}

function render(el) {
  rootEl.innerHTML = '';
  rootEl.appendChild(el);
}

const templates = {
  index: document.querySelector('#index').content,
  indexTr: document.querySelector('#index-tr').content,
  newPost: document.querySelector('#new-post').content,
  viewPost: document.querySelector('#view-post').content,
  login: document.querySelector('#login').content,
  commentItem: document.querySelector('#comment-item').content,
}

// RORO pattern https://medium.freecodecamp.org/elegant-patterns-in-modern-javascript-roro-be01e7669cbd
async function index({page = 1} = {}) {
  const {data: posts} = await postApi.get(`/posts?_page=${page}&_expand=user`);
  const indexEl = document.importNode(templates.index, true);
  const tbodyEl = indexEl.querySelector('.index__tbody');
  posts.forEach(({id, title, user: { username }}) => {
    const trEl = document.importNode(templates.indexTr, true);
    trEl.querySelector('.index-tr__number').textContent = id;
    trEl.querySelector('.index-tr__title').textContent = title;
    trEl.querySelector('.index-tr__author').textContent = username;
    trEl.querySelector('.index-tr__title').addEventListener('click', e => {
      viewPost(id);
    })
    tbodyEl.appendChild(trEl);
  })
  indexEl.querySelector('.index__new-post').addEventListener('click', e => {
    newPost();
  })
  indexEl.querySelector('.index__login-button').addEventListener('click', e => {
    login();
  })
  indexEl.querySelector('.index__logout-button').addEventListener('click', e => {
    removeAuth();
    index();
  })
  render(indexEl);
}

async function newPost() {
  const postFormEl = document.importNode(templates.newPost, true);
  postFormEl.querySelector('.new-post__cancel').addEventListener('click', e => {
    e.preventDefault();
    index();
  })
  postFormEl.querySelector('.new-post__form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      title: e.target.elements.title.value,
      body: e.target.elements.body.value,
    };
    const res = await postApi.post('/posts', payload);
    if (res.status === 401) {
      alert('로그인이 되지 않았습니다.');
    } else {
      index();
    }
  })
  render(postFormEl);
}

async function viewPost(id) {
  const viewPostEl = document.importNode(templates.viewPost, true);
  const res = await postApi.get(`/posts/${id}`);
  if (res.status === 200) {
    const { title, body, author } = res.data;
    viewPostEl.querySelector('.view-post__title').textContent = title;
    viewPostEl.querySelector('.view-post__body').textContent = body;
    viewPostEl.querySelector('.view-post__author').textContent = author;
    viewPostEl.querySelector('.view-post__back').addEventListener('click', e => {
      index();
    })
  } else {
    alert('존재하지 않는 게시물입니다.');
    index();
  }
  if (authed) {
    const res = await postApi.get(`/posts/${id}/comments?_expand=user`);
    const commentListEl = viewPostEl.querySelector('.view-post__comment-list');
    res.data.forEach(({body, user: { username }}) => {
      const commentItemEl = document.importNode(templates.commentItem, true);
      commentItemEl.querySelector('.comment-item__author').textContent = username;
      commentItemEl.querySelector('.comment-item__body').textContent = body;
      commentListEl.appendChild(commentItemEl);
    })
    viewPostEl.querySelector('.view-post__comment-form').addEventListener('submit', async e => {
      e.preventDefault();
      e.target.querySelector('.view-post__comment-fieldset').setAttribute('disabled', '');
      const payload = {
        body: e.target.elements.body.value
      };
      await postApi.post(`/posts/${id}/comments`, payload);
      viewPost(id);
    })
  }
  render(viewPostEl);
}

async function login() {
  const loginEl = document.importNode(templates.login, true);
  loginEl.querySelector('.login__form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value,
    };
    const res = await postApi.post('/users/login', payload);
    if (res.data.token) {
      setAuth(res.data.token);
      index();
    } else {
      alert('로그인을 실패했습니다. 다시 시도해보세요.');
    }
  })
  render(loginEl);
}

index();
