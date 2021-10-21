window.onload = function() {
    for (var p = 0; p < pokemons.length; p++) {
        var parImpar = 'impar';

        if (p % 2 == 0) {
            parImpar = 'par';
        }

        $('#pokedex').append(
            '<a class="pokemon ' + parImpar + '" id="' + pokemons[p].numero + '">' +
            '<img src="' + 'pokes/icons/' + pokemons[p].numero + '.png' + '" />' +
            '<span>' + pokemons[p].numero + ' - ' + pokemons[p].nombre + '</span>' +
            '</a>'
        );

        botonCharClick(p);
    }
    botonChar(0);
}

window.maxBarra = 140;
window.maxTotal = 720;
window.maxStats = 255;

function botonChar(num) {
    $('#pokeinfo').html('');


    /*----- DATOS BASICOS -----*/


    var elementos = '<img src="elementos/' + pokemons[num].elem1 + '.gif">';

    if (pokemons[num].elem2 != '') {
        elementos = elementos + '<img src="elementos/' + pokemons[num].elem2 + '.gif">';
    }

    $('#pokeinfo').append(
        '<div class="pokemon-foto">' +
        '<div class="pokemon-foto-f" style="background-image:url(pokes/front/' + pokemons[num].numero + '.gif);"></div>' +
        '</div>' +
        '<div class="pokemon-info">' +
        '<div class="pokemon-info-nombre">' + pokemons[num].numero + ' - ' + pokemons[num].nombre + '</div>' +
        '<div class="pokemon-info-elementos">' + elementos + '</div>' +
        '</div>'
    );


    /*----- STATS -----*/


    var pxTotal = Math.ceil(window.maxBarra * (pokemons[num].stats.total / window.maxTotal));
    var pxVid = Math.ceil(window.maxBarra * (pokemons[num].stats.vid / window.maxStats));
    var pxAtq = Math.ceil(window.maxBarra * (pokemons[num].stats.atq / window.maxStats));
    var pxDef = Math.ceil(window.maxBarra * (pokemons[num].stats.def / window.maxStats));
    var pxAes = Math.ceil(window.maxBarra * (pokemons[num].stats.aes / window.maxStats));
    var pxDes = Math.ceil(window.maxBarra * (pokemons[num].stats.des / window.maxStats));
    var pxVel = Math.ceil(window.maxBarra * (pokemons[num].stats.vel / window.maxStats));

    $('#pokeinfo').append(
        '<div class="pokemon-stats">' +
        '<div class="pokemon-stats-info">Total:</div>' +
        '<div class="pokemon-stats-bar" style="width:' + pxTotal + 'px; background-color:#F00; color:#FFF;">' +
        pokemons[num].stats.total +
        '</div>' +
        '<div class="pokemon-stats-info">Salud:</div>' +
        '<div class="pokemon-stats-bar" style="width:' + pxVid + 'px;">' + pokemons[num].stats.vid + '</div>' +
        '<div class="pokemon-stats-info">Ataque:</div>' +
        '<div class="pokemon-stats-bar" style="width:' + pxAtq + 'px;">' + pokemons[num].stats.atq + '</div>' +
        '<div class="pokemon-stats-info">Defensa:</div>' +
        '<div class="pokemon-stats-bar" style="width:' + pxDef + 'px;">' + pokemons[num].stats.def + '</div>' +
        '<div class="pokemon-stats-info">Atq.Especial:</div>' +
        '<div class="pokemon-stats-bar" style="width:' + pxAes + 'px;">' + pokemons[num].stats.aes + '</div>' +
        '<div class="pokemon-stats-info">Def.Especial:</div>' +
        '<div class="pokemon-stats-bar" style="width:' + pxDes + 'px;">' + pokemons[num].stats.des + '</div>' +
        '<div class="pokemon-stats-info">Velocidad:</div>' +
        '<div class="pokemon-stats-bar" style="width:' + pxVel + 'px;">' + pokemons[num].stats.vel + '</div>' +
        '</div>'
    );


    /*----- ANIMACION -----*
    	
    	
    	$('#ficha-char').show();
    	$('#ficha-char').animate({opacity:0.9},500);
    	$('#ficha-volver').click(function() {
    		$('#ficha-char').animate({opacity:0},500, function(){
    			$('#ficha-char').hide();
    		});
    	});
    	/**/
}

function botonCharClick(num) {
    $('#' + pokemons[num].numero).click(function() {
        botonChar(num);
    });
}