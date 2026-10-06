/** Piezas compartidas de las vistas del equipo (coordinador, líder y la pestaña Equipo del candidato). */
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { cupoDe, edad, getMiembro } from '@/data/repo';
import * as remoto from '@/data/remoto';
import type { ArchivoLocal, Colaborador, Miembro, RolEquipo, SolicitudVisita } from '@/data/types';
import { diaRelativo, hace, horaTexto } from '@/lib/fechas';
import { useApp } from '@/state/app';
import { type, colors, radius, shadow, estilos } from '@/theme';
import { FotoPerfil } from './FotoPerfil';
import { Text } from './Texto';
import { Badge, Button, Ionicons, Row, Small } from './ui';

export const ROLES: Record<RolEquipo, string> = {
  coordinador: 'Coordinador',
  lider: 'Líder comunal',
  marketing: 'Marketing',
};

export const AYUDA_EN = ['Volanteo', 'Puerta a puerta', 'Logística', 'Redes', 'Transporte', 'Testigo electoral'];

/** Bloque superior en Azul Noche de las vistas del equipo. */
export function CabeceraEquipo({ m, titulo, children }: { m: Miembro; titulo: string; children?: ReactNode }) {
  const { cambiarMiFoto } = useApp();
  return (
    <View style={s.cabecera}>
      <View style={s.ancho}>
        <View style={s.etiqueta}>
          <Text style={s.etiquetaTexto}>{`${ROLES[m.rol]} · ${m.zona.etiqueta}`}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <FotoPerfil nombre={m.nombre} foto={m.foto} size={56} onCambiar={cambiarMiFoto} oscura />
          <Text style={[s.titulo, { flex: 1 }]} accessibilityRole="header">{titulo}</Text>
        </View>
        {children}
      </View>
    </View>
  );
}

/** Dato en el bloque oscuro. */
export function DatoOscuro({ n, label, alerta }: { n: number; label: string; alerta?: boolean }) {
  return (
    <View style={s.dato}>
      <Text style={[s.datoN, alerta && n > 0 && { color: colors.accent }]}>{n}</Text>
      <Text style={s.datoL}>{label}</Text>
    </View>
  );
}

/** Toma una foto con la cámara (no permite escoger de la galería). */
export function FotoCamara({ label, value, onChange, frontal }: { label: string; value?: ArchivoLocal; onChange: (a: ArchivoLocal) => void; frontal?: boolean }) {
  const [error, setError] = useState<string>();
  const tomar = async () => {
    setError(undefined);
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      setError('Permite el uso de la cámara para tomar la foto.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      cameraType: frontal ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
    });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    onChange({ uri: a.uri, nombre: a.fileName ?? `${label}.jpg`, tipo: a.mimeType ?? 'image/jpeg', tamano: a.fileSize });
  };
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Tomar ${label.toLowerCase()}`} onPress={tomar} style={s.foto}>
        {value ? (
          <Image source={{ uri: value.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Ionicons name="camera" size={26} color={colors.primary} />
            <Text style={s.fotoTexto}>Tomar foto</Text>
          </View>
        )}
      </Pressable>
      <Small>{value ? `${label} · tocar para repetir` : label}</Small>
      {error ? <Small style={{ color: colors.dangerFg }}>{error}</Small> : null}
    </View>
  );
}

/** Muestra una foto del equipo: local (recién tomada) o privada en el servidor. */
export function FotoPrivada({ ruta, alto = 130, etiqueta }: { ruta?: string; alto?: number; etiqueta?: string }) {
  const local = !!ruta && /^(file|blob|data|https?|content|ph):/.test(ruta);
  const [url, setUrl] = useState<string | undefined>(local ? ruta : undefined);
  useEffect(() => {
    if (!ruta || local || !remoto.conectado) return;
    let vigente = true;
    remoto.urlFoto(ruta).then((u) => vigente && setUrl(u));
    return () => {
      vigente = false;
    };
  }, [ruta, local]);
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <View style={[s.foto, { height: alto }]} accessibilityLabel={etiqueta}>
        {url ? (
          <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Ionicons name="image-outline" size={26} color={colors.faint} />
        )}
      </View>
      {etiqueta ? <Small>{etiqueta}</Small> : null}
    </View>
  );
}

/** Tarjeta de una visita propuesta por un líder, con aprobar o rechazar si se puede. */
export function SolicitudCard({
  v, onAprobar, onRechazar, nota,
}: { v: SolicitudVisita; onAprobar?: () => void; onRechazar?: () => void; nota?: string }) {
  const lider = getMiembro(v.propuestaPor);
  const estado = v.estado === 'aprobada' ? <Badge label="En la agenda" tone="ok" /> : v.estado === 'rechazada' ? <Badge label="No aprobada" tone="neutral" /> : <Badge label="Por aprobar" tone="warn" />;
  return (
    <View style={s.card}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={type.small}>{`Propone: ${lider?.nombre ?? 'Líder'} · ${v.comunidad.etiqueta}`}</Text>
        {estado}
      </Row>
      <Text style={s.cardTitulo}>{v.lugar}</Text>
      <Small>
        {[`${diaRelativo(v.fecha)}, ${horaTexto(v.fecha)}`, v.asistentesEsperados ? `${v.asistentesEsperados} asistentes esperados` : '']
          .filter(Boolean).join(' · ')}
      </Small>
      {v.temas.length ? <Small>{`Temas: ${v.temas.join(', ').toLowerCase()}`}</Small> : null}
      {v.motivo ? <Small style={{ color: colors.inkSoft }}>{`Respuesta: ${v.motivo}`}</Small> : null}
      {nota ? <Small style={{ color: colors.warnFg }}>{nota}</Small> : null}
      {v.estado === 'pendiente' && (onAprobar || onRechazar) ? (
        <Row gap={8}>
          {onRechazar ? <Button label="No aprobar" variant="secondary" size="md" style={{ flex: 1 }} onPress={onRechazar} /> : null}
          {onAprobar ? <Button label="Agendar" size="md" style={{ flex: 2 }} onPress={onAprobar} /> : null}
        </Row>
      ) : null}
    </View>
  );
}

/** Colaborador con sus fotos, datos y comprobaciones; con aprobar o rechazar si se puede. */
export function ColaboradorCard({
  c, onAprobar, onRechazar, nota,
}: { c: Colaborador; onAprobar?: () => void; onRechazar?: () => void; nota?: string }) {
  const lider = getMiembro(c.lider);
  const anios = edad(c.fechaNacimiento);
  const cupo = cupoDe(c.lider);
  const estado = c.estado === 'activo' ? <Badge label="Activo" tone="ok" /> : c.estado === 'rechazado' ? <Badge label="Rechazado" tone="neutral" /> : <Badge label="Por verificar" tone="warn" />;
  return (
    <View style={s.card}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={[type.small, { flex: 1 }]}>{`Registrado por ${lider?.nombre ?? 'líder'} · ${c.barrioTexto || lider?.zona.etiqueta || ''} · ${hace(c.creado)}`}</Text>
        {estado}
      </Row>
      <Row gap={10}>
        <FotoPrivada ruta={c.fotoRostro} etiqueta="Foto de rostro" />
        <FotoPrivada ruta={c.fotoCedula} etiqueta="Foto de cédula" />
      </Row>
      <Text style={s.cardTitulo}>{c.nombre}</Text>
      <View style={s.datosGrid}>
        <Campo k="Cédula" v={c.cedula} />
        <Campo k="Celular" v={c.celular || '—'} />
        <Campo k="Edad" v={`${anios} años`} />
        <Campo k="Ayuda en" v={c.ayudaEn.join(', ') || '—'} />
      </View>
      <View style={s.checks}>
        <Check ok texto="Autorización de datos firmada" />
        <Check ok={anios >= 18} texto={anios >= 18 ? 'Mayor de edad' : 'Menor de edad: no se puede registrar'} />
        <Check ok={cupo.usados <= cupo.total} texto={`Cupo del líder: ${cupo.usados} de ${cupo.total}`} />
      </View>
      {nota ? <Small style={{ color: colors.warnFg }}>{nota}</Small> : null}
      {c.estado === 'por_verificar' && (onAprobar || onRechazar) ? (
        <Row gap={8}>
          {onRechazar ? <Button label="Rechazar" variant="secondary" size="md" style={{ flex: 1 }} onPress={onRechazar} /> : null}
          {onAprobar ? <Button label="Aprobar colaborador" size="md" style={{ flex: 2 }} onPress={onAprobar} /> : null}
        </Row>
      ) : null}
    </View>
  );
}

function Campo({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ width: '48%', gap: 2 }}>
      <Text style={{ fontSize: 12, color: colors.muted }}>{k}</Text>
      <Text style={{ fontSize: 14, color: colors.ink }}>{v}</Text>
    </View>
  );
}

function Check({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <Row gap={8}>
      <Ionicons name={ok ? 'checkmark' : 'close'} size={18} color={ok ? colors.okFg : colors.dangerFg} />
      <Text style={{ fontSize: 14, fontWeight: '600', color: ok ? colors.okFg : colors.dangerFg }}>{texto}</Text>
    </Row>
  );
}

const s = estilos(() => ({
  datosGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, justifyContent: 'space-between' },
  checks: { gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.background },
  cabecera: { backgroundColor: colors.night, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22 },
  ancho: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 10 },
  etiqueta: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.nightSoft },
  etiquetaTexto: { fontSize: 12, fontWeight: '600', color: colors.onNight },
  titulo: { fontSize: 28, fontWeight: '700', color: colors.onNight, letterSpacing: -0.3 },
  dato: { flex: 1, gap: 2, padding: 12, borderRadius: radius.md, backgroundColor: colors.nightSoft },
  datoN: { fontSize: 24, fontWeight: '700', color: colors.onNight },
  datoL: { fontSize: 13, color: colors.onNightMuted },
  foto: { height: 130, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.inputBorder, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fotoTexto: { fontSize: 14, fontWeight: '600', color: colors.primary },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, gap: 8, ...shadow.sm },
  cardTitulo: { fontSize: 17, fontWeight: '700', color: colors.ink },
}));
