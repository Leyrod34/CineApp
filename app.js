'use strict';

const CLAVE_FAVORITOS = 'cineapp_favoritos';

let peliculas = [];
let favoritos = [];
let filtro    = 'todas';
let busqueda  = '';
let orden     = 'recientes';

const $catalogo      = document.getElementById('catalogo');
const $contador      = document.getElementById('contador');
const $numFavoritos  = document.getElementById('numFavoritos');
const $formBusqueda  = document.getElementById('formBusqueda');
const $inputBusqueda = document.getElementById('inputBusqueda');
const $btnTodos      = document.getElementById('btnTodos');
const $btnFavoritos  = document.getElementById('btnFavoritos');
const $selectOrden   = document.getElementById('selectOrden');

document.addEventListener('DOMContentLoaded', iniciar);

function iniciar() {
	favoritos = cargarFavoritos();
	peliculas = cargarPeliculas();

	if (peliculas.length === 0) {
		mostrarError('No se encontró el catálogo de películas.');
		return;
	}

	conectarEventos();
	renderizar();
}

function cargarPeliculas() {
	if (typeof PELICULAS === 'undefined') {
		console.error('No se encontró la variable PELICULAS.');
		return [];
	}

	if (!Array.isArray(PELICULAS)) {
		console.error('PELICULAS debe ser un array.');
		return [];
	}

	return PELICULAS.slice();
}

function mostrarError(mensaje) {
	console.error(mensaje);
	$catalogo.innerHTML = `
		<p class="sinResultados">
			⚠️ ${mensaje}<br>
			<small>Revisa que <code>peliculas.js</code> esté en la misma carpeta
			y se cargue antes de <code>app.js</code>.</small>
		</p>
	`;
}

function cargarFavoritos() {
	try {
		const guardado = JSON.parse(localStorage.getItem(CLAVE_FAVORITOS));
		return Array.isArray(guardado) ? guardado : [];
	} catch (error) {
		return [];
	}
}

function guardarFavoritos() {
	try {
		localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));
	} catch (error) {
		console.warn('No se pudieron guardar los favoritos.');
	}
}

function esFavorita(id) {
	return favoritos.includes(id);
}

function alternarFavorito(id) {
	const pos = favoritos.indexOf(id);
	if (pos === -1) favoritos.push(id);
	else favoritos.splice(pos, 1);

	guardarFavoritos();
	renderizar();
}

function normalizar(texto) {
	return String(texto)
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

function obtenerVisibles() {
	let lista = peliculas.slice();

	if (filtro === 'favoritos') {
		lista = lista.filter(p => esFavorita(p.id));
	}

	if (busqueda !== '') {
		const consulta = normalizar(busqueda);
		lista = lista.filter(p => normalizar(p.title).includes(consulta));
	}

	return ordenarLista(lista);
}

function ordenarLista(lista) {
	const copia = lista.slice();

	switch (orden) {
		case 'antiguas':
			return copia.sort((a, b) => a.year - b.year);

		case 'az':
			return copia.sort((a, b) =>
				a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));

		case 'za':
			return copia.sort((a, b) =>
				b.title.localeCompare(a.title, 'es', { sensitivity: 'base' }));

		case 'recientes':
		default:
			return copia.sort((a, b) => b.year - a.year);
	}
}

function renderizar() {
	const visibles = obtenerVisibles();

	$catalogo.innerHTML = '';

	if (visibles.length === 0) {
		const mensaje = document.createElement('p');
		mensaje.className = 'sinResultados';
		mensaje.textContent =
			filtro === 'favoritos' && favoritos.length === 0
				? 'Todavía no tienes películas favoritas.'
				: 'No se encontraron películas.';
		$catalogo.appendChild(mensaje);
	} else {
		const fragmento = document.createDocumentFragment();
		visibles.forEach(p => fragmento.appendChild(crearTarjeta(p)));
		$catalogo.appendChild(fragmento);
	}

	const n = visibles.length;
	$contador.textContent = `${n} ${n === 1 ? 'película encontrada' : 'películas encontradas'}`;
	$numFavoritos.textContent = favoritos.length;

	$btnTodos.classList.toggle('activo', filtro === 'todas');
	$btnFavoritos.classList.toggle('activo', filtro === 'favoritos');
}

function crearTarjeta(p) {
	const fav = esFavorita(p.id);

	const card = document.createElement('div');
	card.className = 'pelicula';
	card.dataset.id = p.id;
	if (fav) card.classList.add('esFavorita');

	const cabecera = document.createElement('div');
	cabecera.className = 'nombrePeli';

	const h3 = document.createElement('h3');
	h3.textContent = p.title;

	const img = document.createElement('img');
	img.alt = p.title;
	img.loading = 'lazy';
	img.addEventListener('error', () => img.remove());
	img.src = p.image;

	const btnEstrella = document.createElement('button');
	btnEstrella.type = 'button';
	btnEstrella.className = 'btnEstrella';
	btnEstrella.textContent = fav ? '★' : '☆';
	btnEstrella.title = fav ? 'Quitar de favoritos' : 'Agregar a favoritos';
	btnEstrella.setAttribute('aria-label', btnEstrella.title);
	btnEstrella.addEventListener('click', () => alternarFavorito(p.id));

	cabecera.append(img, h3, btnEstrella);

	const detalles = document.createElement('div');
	detalles.className = 'detailsPeli';

	const nombre = document.createElement('h4');
	nombre.className = 'namePeli';
	nombre.textContent = p.title;

	const anno = document.createElement('h5');
	anno.className = 'annoPeli';
	anno.textContent = p.year;

	const genero = document.createElement('div');
	genero.className = 'generoPeli';
	genero.textContent = p.genre;

	detalles.append(nombre, anno, genero);

	const pie = document.createElement('div');
	pie.className = 'buttonAddFav';

	const btnFav = document.createElement('button');
	btnFav.type = 'button';
	btnFav.textContent = fav ? '★ Quitar de favoritos' : '+ Agregar a favoritos';
	if (fav) btnFav.classList.add('activo');
	btnFav.addEventListener('click', () => alternarFavorito(p.id));

	pie.appendChild(btnFav);

	card.append(cabecera, detalles, pie);
	return card;
}

function conectarEventos() {

	$formBusqueda.addEventListener('submit', (evento) => {
		evento.preventDefault();
		busqueda = $inputBusqueda.value.trim();
		renderizar();
	});

	$btnTodos.addEventListener('click', () => {
		filtro = 'todas';
		renderizar();
	});

	$btnFavoritos.addEventListener('click', () => {
		filtro = 'favoritos';
		renderizar();
	});

	$selectOrden.addEventListener('change', (evento) => {
		orden = evento.target.value;
		renderizar();
	});
}