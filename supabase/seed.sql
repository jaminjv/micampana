-- Datos iniciales de prueba.
-- Partidos: reemplazar con el registro oficial vigente del CNE antes de producción.
-- Municipios: cargar la DIVIPOLA completa del DANE; aquí solo Caquetá como ejemplo.

insert into partidos (id, nombre, sigla) values
  ('liberal', 'Partido Liberal Colombiano', null),
  ('conservador', 'Partido Conservador Colombiano', null),
  ('cd', 'Partido Centro Democrático', null),
  ('cambio', 'Partido Cambio Radical', null),
  ('u', 'Partido de la U', null),
  ('verde', 'Partido Alianza Verde', null),
  ('pacto', 'Pacto Histórico', null),
  ('nuevolib', 'Partido Nuevo Liberalismo', null),
  ('comunes', 'Partido Comunes', null),
  ('enmarcha', 'Partido En Marcha', null),
  ('oxigeno', 'Partido Oxígeno', null),
  ('ecologista', 'Partido Ecologista Colombiano', null),
  ('cjl', 'Partido Colombia Justa Libres', null),
  ('mais', 'Movimiento Alternativo Indígena y Social', 'MAIS'),
  ('aico', 'Movimiento Autoridades Indígenas de Colombia', 'AICO');

insert into departamentos (codigo, nombre) values ('18', 'Caquetá');

-- Códigos ilustrativos: usar los códigos DIVIPOLA oficiales.
insert into municipios (codigo, nombre, departamento, capital) values
  ('18001', 'Florencia', '18', true),
  ('18002', 'Albania', '18', false),
  ('18003', 'Belén de los Andaquíes', '18', false),
  ('18004', 'Cartagena del Chairá', '18', false),
  ('18005', 'Curillo', '18', false),
  ('18006', 'El Doncello', '18', false),
  ('18007', 'El Paujil', '18', false),
  ('18008', 'La Montañita', '18', false),
  ('18009', 'Milán', '18', false),
  ('18010', 'Morelia', '18', false),
  ('18011', 'Puerto Rico', '18', false),
  ('18012', 'San José del Fragua', '18', false),
  ('18013', 'San Vicente del Caguán', '18', false),
  ('18014', 'Solano', '18', false),
  ('18015', 'Solita', '18', false),
  ('18016', 'Valparaíso', '18', false);
