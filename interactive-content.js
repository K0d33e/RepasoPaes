/* Experiencias visuales propias, esquemáticas y no a escala. */
window.PAES_INTERACTIVE = {
  liberalismo: {
    map: {type:'world', title:'Las ideas no viajaron solas', caption:'Rutas atlánticas y procesos nacionales (esquema, no a escala).', points:[
      ['Europa',53,32,'Ideas liberales y revoluciones','Los debates sobre representación, derechos y constitucionalismo circularon en Europa; no todos los regímenes cambiaron de la misma manera.'],
      ['América',29,58,'Independencias y nuevas repúblicas','Los nuevos Estados americanos adaptaron ideas de soberanía y ciudadanía a sus conflictos políticos y sociales.'],
      ['Europa central',64,22,'Movimientos de unificación','Alemania e Italia muestran que las identidades nacionales también impulsaron nuevas configuraciones estatales.']
    ]},
    sourceGame: {prompt:'Un texto de 1850 exige igualdad ante la ley y el padrón electoral solo incorpora a una minoría. ¿Qué conclusión admite esta evidencia?', options:['Las propuestas igualitarias podían convivir con exclusiones políticas.', 'La igualdad jurídica eliminó automáticamente las barreras electorales.', 'La presencia de un padrón demuestra que no existían instituciones.'], answer:0, explain:'Contrastar el discurso con el padrón permite reconocer el desfase entre principios y participación efectiva.'}
  },
  chile19: {
    map: {type:'chile',title:'Un territorio, procesos diferentes',caption:'Mapa de zonas históricas, representado de manera esquemática.', points:[
      ['Norte Grande',43,24,'Salitre y economía mundial','Tras la Guerra del Pacífico, las zonas salitreras adquirieron gran relevancia exportadora y fiscal.'],
      ['Zona central',45,51,'Instituciones, puertos y ciudades','Santiago y Valparaíso concentraron funciones políticas, comercio e infraestructura durante buena parte del siglo XIX.'],
      ['Sur y Araucanía',46,78,'Expansión estatal y conflicto','La ocupación militar de la Araucanía durante el siglo XIX afectó territorios y comunidades mapuche.']
    ]},
    sourceGame:{prompt:'Un puerto registra más comercio y, al mismo tiempo, más viviendas hacinadas. ¿Qué investigación permitiría explicar mejor esta contradicción?',options:['Comparar salarios, arriendos y condiciones sanitarias con la actividad portuaria.','Usar únicamente el volumen total de exportaciones del puerto.','Concluir que el aumento comercial demuestra bienestar universal.'],answer:0,explain:'Se necesitan fuentes sobre distribución de beneficios y condiciones de vida, no solo comercio.'}
  },
  crisisxx: {
    map:{type:'world',title:'Una crisis con respuestas diferentes',caption:'Tres regiones ilustran impactos y respuestas políticas. Ubicaciones aproximadas.',points:[
      ['Estados Unidos',20,33,'Crisis financiera de 1929','La caída bursátil fue parte del inicio de una crisis económica internacional con graves consecuencias sociales.'],
      ['Europa',54,29,'Modelos autoritarios y políticas estatales','En Europa coexistieron respuestas democráticas, intervencionistas y proyectos totalitarios.'],
      ['América Latina',31,67,'Industrialización y nuevas coaliciones','Varios países impulsaron políticas de industrialización y ampliaron la intervención económica estatal.']
    ]},
    sourceGame:{prompt:'Una fuente muestra desempleo alto en 1932 y otra registra nuevos programas estatales de empleo. ¿Qué relación es más razonable estudiar?',options:['Cómo el impacto social de la crisis favoreció cambios en las políticas públicas.','Que todas las democracias desaparecieron luego de 1929.','Que las políticas estatales surgieron sin relación alguna con la situación económica.'],answer:0,explain:'La comparación ayuda a explorar respuestas a la crisis, sin generalizar sus efectos en todos los países.'}
  },
  guerr_fria: {
    map:{type:'world',title:'El mundo bipolar y sus zonas de influencia',caption:'Mapa didáctico: no representa fronteras ni alianzas exactas.',points:[
      ['Estados Unidos',20,33,'Bloque occidental','Estados Unidos lideró alianzas políticas y militares asociadas al bloque occidental.'],
      ['Europa',54,28,'Un continente dividido','La división de Alemania y Berlín expresó la confrontación en Europa durante la Guerra Fría.'],
      ['Unión Soviética',69,21,'Bloque socialista','La URSS encabezó alianzas y redes de influencia, especialmente en Europa oriental.'],
      ['América Latina',29,62,'Conflictos y reformas','La confrontación global incidió en revoluciones, dictaduras y disputas políticas de países latinoamericanos.']
    ]},
    sourceGame:{prompt:'Dos potencias financian a actores rivales en un tercer país sin combatirse directamente entre sí. ¿Qué concepto ayuda a explicar esta dinámica?',options:['Conflicto indirecto dentro de la confrontación bipolar.','Ausencia total de intereses geopolíticos.','Desaparición de los bloques durante la Guerra Fría.'],answer:0,explain:'La rivalidad entre bloques incluyó enfrentamientos indirectos y competencia por influencia.'}
  },
  chilexx: {
    map:{type:'chile',title:'Cambios sociales y políticos en el país',caption:'Esquema territorial para vincular procesos sociales con espacios.',points:[
      ['Norte',43,25,'Trabajo y urbanización','Las dinámicas mineras y migraciones internas se vincularon con transformaciones económicas y sociales.'],
      ['Zona central',45,52,'Movilización y vida política','El crecimiento urbano y la participación de nuevos actores incidieron en debates sobre reformas, derechos y democracia.'],
      ['Todo Chile',46,79,'Dictadura, derechos y memoria','Las violaciones a los derechos humanos ocurrieron en distintas zonas del país; su investigación exige múltiples fuentes.']
    ]},
    sourceGame:{prompt:'Un informe reúne testimonios y documentos sobre detenciones durante la dictadura. ¿Cuál es la mejor forma de utilizarlo?',options:['Contrastar evidencias y contexto para analizar responsabilidades y vulneraciones de derechos.','Tratar un solo testimonio como explicación suficiente de todos los casos.','Ignorar las fuentes porque el pasado no puede investigarse.'],answer:0,explain:'La investigación histórica se apoya en contraste documental, testimonios y contexto.'}
  },
  democracia: {
    map:{type:'chile',title:'¿Dónde funcionan las instituciones?',caption:'Ubicaciones de referencia; la competencia institucional es nacional.',points:[
      ['Valparaíso',34,43,'Congreso Nacional','El Congreso tiene su sede en Valparaíso y participa en la elaboración de las leyes y fiscalización según sus atribuciones.'],
      ['Santiago',53,53,'Poder Ejecutivo','La Presidencia y buena parte de la administración central desarrollan sus funciones desde Santiago.'],
      ['Justicia',43,72,'Poder Judicial','Los tribunales ejercen la función jurisdiccional. La Corte Suprema tiene su sede en Santiago, y existen tribunales en todo el país.']
    ]},
    sourceGame:{prompt:'Un municipio publica su presupuesto y responde preguntas de organizaciones vecinales. ¿Qué dimensiones democráticas se observan?',options:['Transparencia, rendición de cuentas y participación ciudadana.','Sustitución de todas las autoridades por una asamblea espontánea.','Eliminación del deber de informar las decisiones públicas.'],answer:0,explain:'Una democracia funciona también mediante control ciudadano, transparencia y responsabilidad de las autoridades.'}
  },
  ciudadania: {
    map:{type:'world',title:'Una noticia puede cruzar fronteras',caption:'Escenario didáctico ficticio: nodos de información, no hechos geográficos reales.',points:[
      ['Origen',19,34,'Primera publicación','El primer contenido no siempre es la fuente original: hay que revisar autoría, fecha y evidencia.'],
      ['Difusión',55,27,'Reproducción acelerada','Un mensaje puede circular por muchas cuentas sin que eso confirme su veracidad.'],
      ['Verificación',31,68,'Chequeo desde Chile','Antes de compartir, es útil contrastar con fuentes primarias, datos y medios independientes.']
    ]},
    sourceGame:{prompt:'Una publicación viral cita un supuesto estudio, pero no incluye autor, metodología ni enlace. ¿Qué harías primero?',options:['Buscar el estudio original y revisar quién lo publicó y cómo obtuvo sus datos.','Difundirlo porque alcanzó muchas interacciones.','Considerarlo verdadero porque coincide con una opinión propia.'],answer:0,explain:'La popularidad de una publicación no sustituye la verificación de la fuente primaria.'}
  },
  mercado: {
    map:{type:'world',title:'La economía funciona en redes',caption:'Flujos globales esquemáticos, sin representar volúmenes reales.',points:[
      ['Chile',31,70,'Producción y exportación','Una empresa puede vender bienes al mercado externo y depender de variaciones en demanda y precios internacionales.'],
      ['Asia',72,39,'Mercado de destino','Consumidores y empresas en otros mercados modifican la demanda de productos y materias primas.'],
      ['Europa',54,28,'Regulación y acuerdos','Normas, impuestos y acuerdos comerciales inciden en las condiciones de intercambio y competencia.']
    ]},
    sourceGame:{prompt:'En un mercado aumenta la demanda y la oferta no cambia de inmediato. ¿Qué efecto tiende a observarse, manteniendo constantes otros factores?',options:['Presión al alza sobre el precio de equilibrio.','Caída automática de la demanda a cero.','Ausencia necesaria de cualquier variación en el mercado.'],answer:0,explain:'Con una curva de oferta sin cambios, un desplazamiento de la demanda hacia la derecha eleva el precio de equilibrio.'}
  },
  trabajo: {
    map:{type:'chile',title:'El trabajo cambia según la actividad y el territorio',caption:'Ejemplos generales, no un catastro estadístico regional.',points:[
      ['Norte',42,24,'Minería y seguridad','Actividades extractivas requieren prevención de riesgos, legislación laboral y controles de seguridad.'],
      ['Centro',45,52,'Servicios y empleo urbano','Comercio, servicios y plataformas plantean desafíos de formalización, negociación y protección.'],
      ['Sur',46,78,'Agroindustria y temporalidad','En actividades estacionales cobran especial importancia las condiciones contractuales y la protección laboral.']
    ]},
    sourceGame:{prompt:'Un trabajador tiene jornada y remuneración pactadas, pero la empresa impide registrar horas extraordinarias. ¿Qué evidencia es más útil?',options:['Contrato, registro de asistencia y normas vigentes para verificar cumplimiento.','Solo una publicidad institucional de la empresa.','Solo opiniones de terceros sin relación con el caso.'],answer:0,explain:'El análisis de derechos laborales requiere contrastar las condiciones reales con documentos y normativa.'}
  }
};
