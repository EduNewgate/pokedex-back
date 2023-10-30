var express = require('express');
var fetch = require('node-fetch');

var app = express();

app.get('/', async (req, response) => {
    const results = await fetch('https://pokeapi.co/api/v2/pokedex/1/');
    const entries = await results.json();
    let respuesta = await generarRespuesta(entries, req.query);

    response.status(200).json({
        ok: true,
        resultados: respuesta
    });
});

async function generarRespuesta(entries, params) {
    let entradas = await generarEntradas(entries, params)

    return {
        listadoCompleto: entries.pokemon_entries,
        nombrePokedex: entries.name,
        entradas: entradas
    }
}

async function generarEntradas(entries, params) {
    let limit = params.limit ? +params.limit : 20;
    let offset = params.offset ? +params.offset : 0;
    let searchText = params.searchText;
    let entradas = new Array();
    if (!searchText || searchText === '') {
        const pokemonEntries = await getPokemonEntries('https://pokeapi.co/api/v2/pokemon-species?offset='+offset+'&limit='+limit);

        for (let index = offset; index < (offset + limit); index++) {
            const element = entries.pokemon_entries[index];
            entradas.push({numero: element.entry_number.toString().padStart(4, '0')})
        }
        
        // Me quedo sólo con el nombre del pokémon.
        for (let index = 0; index < limit; index++) {
            const entry = pokemonEntries.results[index];
            await generarEntrada(entry, entradas[index]);
        }
    } else {
        for (const entry of entries.pokemon_entries) {
            if (entry.pokemon_species.name.includes(searchText)) {
                let entrada = {numero: entry.entry_number.toString().padStart(4, '0')};
                await generarEntrada(entry.pokemon_species, entrada);
                entradas.push(entrada);
            }
        }
    }
    
    return entradas;
}

async function generarEntrada(entry, entrada) {
    entrada.nombre = entry.name;
    const pkmnSpecieResult = await fetch(entry.url);
    const pkmnSpecie = await pkmnSpecieResult.json();
    const cadenaEvolutivaResult = await fetch(pkmnSpecie.evolution_chain.url);
    const cadenaEvolutiva = await cadenaEvolutivaResult.json();
    let cadenaEvolutivaRespuesta = construirCadenaEvolutivaJson(cadenaEvolutiva.chain);
    entrada.cadena_evolutiva = cadenaEvolutivaRespuesta;
    entrada.formas = await construirFormas(pkmnSpecie.varieties);
}

async function getPokemonEntries(url) {
    const pkmnEntriesResult = await fetch(url);
    const pkmnEntries = await pkmnEntriesResult.json();
    return pkmnEntries;
}

function construirCadenaEvolutivaJson(cadena) {
    let objeto = {};

    for (let index = 0; index < cadena.evolves_to.length; index++) {
        objeto = {
            nombre: cadena.species.name,
            detalles: cadena.evolution_details,
            evoluciona_a: obtenerEvoluciones(cadena.evolves_to)
        };
    }

    return objeto;
}

function obtenerEvoluciones(evoluciones) {
    let listaEvoluciones = []
    
    for (let index = 0; index < evoluciones.length; index++) {
        let evolucion = {}
        const element = evoluciones[index];
        evolucion.nombre = element.species.name;
        evolucion.detalles = element.evolution_details;
        evolucion.evoluciona_a = obtenerEvoluciones(element.evolves_to);
        listaEvoluciones.push(evolucion);
    }

    return listaEvoluciones;
}

async function construirFormas(formas) {
    let formasPkmn = [];

    for (let index = 0; index < formas.length; index++) {
        const element = formas[index];
        let forma = {
            default: element.is_default,
            nombre: element.pokemon.name,
            url: element.pokemon.url,
            tipos: await construirTipos(element.pokemon.url)
        };
        formasPkmn.push(forma);
    }

    return formasPkmn;
}

async function construirTipos(url) {
    let tipos = [];

    const pokemonResult = await fetch(url);
    const pokemon = await pokemonResult.json();
    for (let index = 0; index < pokemon.types.length; index++) {
        const element = pokemon.types[index];
        let tipo = {
            nombre: element.type.name,
            url: element.type.url
        }
        tipos.push(tipo);
    }

    return tipos;
}

module.exports = app;