import './index.scss';
import axios from 'axios';

axios.defaults.validateStatus = () => true;

const baseURL = process.env.API_BASE_URL;
console.log(baseURL);

let postApi = axios.create({
  baseURL,
});

const root = document.querySelector('#root');

function render(el) {
  root.textContent = '';
  console.log(el);
  root.appendChild(el);
}

function interpolate(el, obj) {
  Object.entries(obj).forEach(([key, value]) => {
    const matched = el.querySelector(`[data-prop=${key}]`);
    if (matched) {
      matched.textContent = value;
    }
  })
}

const templates = {
  index: document.querySelector('#index').content,
  indexTr: document.querySelector('#index-tr').content,
  newPost: document.querySelector('#new-post').content,
  postView: document.querySelector('#post-view').content,
  login: document.querySelector('#login').content,
}

// RORO pattern https://medium.freecodecamp.org/elegant-patterns-in-modern-javascript-roro-be01e7669cbd
async function index({page = 1} = {}) {
  const {data: posts} = await postApi.get(`/posts?_page=${page}`);
  const indexEl = document.importNode(templates.index, true);
  const tbodyEl = indexEl.querySelector('.index__tbody');
  posts.forEach(({id, title}) => {
    const trEl = document.importNode(templates.indexTr, true);
    interpolate(trEl, {id, title, author: '익명'});
    tbodyEl.appendChild(trEl);
  })
  indexEl.querySelector('.index__new-post').addEventListener('click', e => {
    newPost();
  })
  indexEl.querySelector('.index__login-button').addEventListener('click', e => {
    login();
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
      localStorage.setItem('token', res.data.token);
      postApi.defaults.headers['Authorization'] = `Bearer ${res.data.token}`;
      index();
    } else {
      alert('로그인을 실패했습니다. 다시 시도해보세요.');
    }
  })
  render(loginEl);
}

index();
