import './index.scss';
import axiosDefault from 'axios';

const baseURL = process.env.API_BASE_URL;
console.log(baseURL);

let axios = axiosDefault.create({
  baseURL
});

const root = document.querySelector('#root');

function render(el) {
  root.textContent = '';
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
  postForm: document.querySelector('#post-form').content,
  postView: document.querySelector('#post-view').content,
}

async function indexTable() {
  const {data: posts} = await axios.get('/posts');
  const indexEl = document.importNode(templates.index, true);
  const tbodyEl = indexEl.querySelector('.index__tbody');
  posts.forEach(({id, title}) => {
    const trEl = document.importNode(templates.indexTr, true);
    interpolate(trEl, {id, title, author: 'asdf'});
    tbodyEl.appendChild(trEl);
  })
  indexEl.querySelector('.index__new-post').addEventListener('click', e => {
    postForm();
  })
  render(indexEl);
}

indexTable();

async function postForm() {
  const postFormEl = document.importNode(templates.postForm, true);
  render(postFormEl);
}
