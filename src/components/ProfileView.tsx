/**
 * Onglet Profil (dock) : ton perso, ton poids, ton programme, les paramètres (son du coach,
 * sauvegardes, mode admin) et ton compte. Même place que le Profil de TrailJourney ; le Menu, lui,
 * ne contient que de la navigation.
 */
import { LogOut, Stethoscope } from 'lucide-react'
import type { ReactNode } from 'react'
import { lock } from '../lib/auth'
import { getGoogleSession } from '../lib/googleAuth'
import { AVATARS, avatarOf } from '../lib/suite'
import { updateProfile, useData } from '../lib/storage'
import { SettingsPanel } from './SettingsPanel'

export interface CloudInfo {
  email: string
  status: string
  onRedoProgram: () => void
  logoutLabel?: string
  isOwner?: boolean
}

export function ProfileView({ cloud, onLock, onTests }: { cloud?: CloudInfo; onLock: () => void; onTests: () => void }) {
  const { profile } = useData()
  const account = getGoogleSession()
  const avatar = avatarOf(profile.avatar)
  const unit = profile.weightUnit ?? 'kg'

  return (
    <section className="mx-auto mt-2 flex max-w-xl flex-col gap-4" aria-label="Mon profil">
      <Block title="Ton perso" desc="Il s’affiche en haut à droite et dans le dock. Sur TrailJourney, il représente le coureur sur la carte.">
        <div role="radiogroup" aria-label="Ton perso" className="grid grid-cols-5 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={avatar === a}
              aria-label={`Perso ${a}`}
              onClick={() => updateProfile({ avatar: a })}
              className={`b-btn grid h-12 place-items-center text-[24px] ${avatar === a ? 'border-flame! bg-flame/20!' : ''}`}
            >
              {a}
            </button>
          ))}
        </div>
      </Block>

      <Block title="Poids" desc="Il sert à doser les protéines, glucides et l’eau dans le bilan de fin de séance.">
        <div className="flex gap-2">
          <input
            id="profile-weight"
            inputMode="decimal"
            defaultValue={profile.weightKg ? String(Math.round((unit === 'lbs' ? profile.weightKg * 2.20462 : profile.weightKg) * 10) / 10) : ''}
            key={unit}
            onChange={(e) => {
              const v = parseFloat(e.target.value.replace(',', '.'))
              updateProfile({ weightKg: Number.isFinite(v) && v > 0 ? Math.round((unit === 'lbs' ? v / 2.20462 : v) * 10) / 10 : undefined })
            }}
            placeholder="Poids"
            aria-label="Poids"
            className="b-input h-11 min-w-0 flex-1 px-3 font-mono text-[15px]"
          />
          {(['kg', 'lbs'] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              onClick={() => updateProfile({ weightUnit: u })}
              className={`b-btn h-11 w-14 text-[13px] uppercase tracking-wide ${unit === u ? 'b-btn-ink' : ''}`}
            >
              {u}
            </button>
          ))}
        </div>
        {profile.weightKg && (
          <p className="mt-2 text-[12px] font-semibold text-ink/65">
            Enregistré : {profile.weightKg} kg · repère protéines {Math.round((profile.weightKg * 0.3) / 5) * 5}-{Math.round((profile.weightKg * 0.4) / 5) * 5} g après la séance.
          </p>
        )}
      </Block>

      <Block title="Mon programme" desc="Tests gauche / droite toutes les 4 semaines pour suivre tes progrès.">
        <div className="grid gap-2">
          {cloud && (
            <button type="button" onClick={cloud.onRedoProgram} className="b-btn flex h-12 w-full items-center justify-center gap-2 bg-sun text-on text-[13px] uppercase tracking-wide">
              ✨ Refaire mon programme
            </button>
          )}
          <button type="button" onClick={onTests} className="b-btn flex h-12 w-full items-center justify-center gap-2 text-[13px] uppercase tracking-wide">
            📏 Tests mensuels
          </button>
        </div>
      </Block>

      <h2 className="kicker mt-2">Paramètres</h2>
      <SettingsPanel cloud={cloud} />

      <Block title="Mon compte" desc={cloud ? `${cloud.email} · ${cloud.status}` : account ? account.email : 'Session PIN sur cet appareil'}>
        <button
          type="button"
          onClick={() => {
            if (!cloud) lock()
            onLock()
          }}
          className="b-btn flex h-12 w-full items-center justify-center gap-2 text-[13px] uppercase tracking-wide"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.4} /> {cloud?.logoutLabel ?? 'Se déconnecter'}
        </button>
      </Block>

      <p className="flex items-start justify-center gap-1.5 text-center text-[12px] font-semibold leading-snug text-ink/70">
        <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} /> Repères d’entraînement, pas un avis médical : en cas de douleur ou de blessure, consulte un physio.
      </p>
      <p className="mb-2 text-center text-[11px] text-ink/45">TrailStrong 2026 · v{__APP_VERSION__} · {cloud ? 'données synchronisées sur ton compte' : 'données 100 % locales'}</p>
    </section>
  )
}

function Block({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <section className="b-card p-4">
      <h3 className="text-[16px] font-black uppercase tracking-wide">{title}</h3>
      <p className="mb-3 mt-1 text-[13px] font-semibold leading-snug text-ink/75">{desc}</p>
      {children}
    </section>
  )
}
