import './index.scss';
import axios from 'axios';

let authed = false;
let currentUser;
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
  currentUser = null;
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
  const fragment = document.importNode(templates.index, true);
  const tbodyEl = fragment.querySelector('.index__tbody');
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
  fragment.querySelector('.index__new-post').addEventListener('click', e => {
    newPost();
  })
  fragment.querySelector('.index__login-button').addEventListener('click', e => {
    login();
  })
  fragment.querySelector('.index__logout-button').addEventListener('click', e => {
    removeAuth();
    index();
  })
  render(fragment);
}

async function newPost() {
  const fragment = document.importNode(templates.newPost, true);
  fragment.querySelector('.new-post__cancel').addEventListener('click', e => {
    e.preventDefault();
    index();
  })
  fragment.querySelector('.new-post__form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      title: e.target.elements.title.value,
      body: e.target.elements.body.value,
    };
    const res = await postApi.post('/posts', payload);
    viewPost(res.data.id);
  })
  render(fragment);
}

// FIXME: fds-json-server '본인 확인 기능' 추가 후 주석 제거
// async function editPost(id) {
//   const fragment = document.importNode(templates.newPost, true);
//   fragment.querySelector('.new-post__cancel').addEventListener('click', e => {
//     e.preventDefault();
//     index();
//   })
//   fragment.querySelector('.new-post__form').addEventListener('submit', async e => {
//     e.preventDefault();
//     const payload = {
//       title: e.target.elements.title.value,
//       body: e.target.elements.body.value,
//     };
//     const res = await postApi.patch(`/posts/${id}`, payload);
//   })
//   render(fragment);
// }

async function viewPost(postId) {
  const fragment = document.importNode(templates.viewPost, true);
  const viewPostEl = fragment.querySelector('.view-post');
  const res = await postApi.get(`/posts/${postId}`);
  const { title, body, author } = res.data;
  fragment.querySelector('.view-post__title').textContent = title;
  fragment.querySelector('.view-post__body').textContent = body;
  fragment.querySelector('.view-post__author').textContent = author;
  fragment.querySelector('.view-post__back').addEventListener('click', e => {
    index();
  });
  if (authed) {
    const res = await postApi.get(`/posts/${postId}/comments?_expand=user`);
    const commentListEl = fragment.querySelector('.view-post__comment-list');
    res.data.forEach(({body, user: { username }}) => {
      const commentItemEl = document.importNode(templates.commentItem, true);
      commentItemEl.querySelector('.comment-item__author').textContent = username;
      commentItemEl.querySelector('.comment-item__body').textContent = body;
      commentListEl.appendChild(commentItemEl);
    })
    fragment.querySelector('.view-post__comment-form').addEventListener('submit', async e => {
      e.preventDefault();
      e.target.querySelector('.view-post__comment-fieldset').setAttribute('disabled', '');
      const payload = {
        body: e.target.elements.body.value
      };
      await postApi.post(`/posts/${postId}/comments`, payload);
      viewPost(postId);
    })
    // FIXME: fds-json-server '본인 확인 기능' 추가 후 주석 제거
    // if (!currentUser) {
    //   const res = await postApi.get('/me');
    //   currentUser = res.data;
    // }
    // if (currentUser.username === author) {
    //   viewPostEl.classList.add('.view-post--is-owner');
    //   fragment.querySelector('.view-post__edit-post-button').addEventListener('click', e => {
    //     editPost(postId);
    //   })
    // }
  }
  render(fragment);
}

async function login() {
  const fragment = document.importNode(templates.login, true);
  fragment.querySelector('.login__form').addEventListener('submit', async e => {
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
  render(fragment);
}

index();
