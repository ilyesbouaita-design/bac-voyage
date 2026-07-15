import { createEngine, type EngineParts } from "../../bootstrap.ts";
import { ExactMatchSkill } from "../../skills/ExactMatchSkill.ts";
import { ConnectorSkill } from "../../skills/connectors/ConnectorSkill.ts";
import { DeclensionEndingSkill } from "../../skills/declension/DeclensionEndingSkill.ts";
import { AuxiliaryVerbSkill } from "../../skills/grammar/AuxiliaryVerbSkill.ts";
import { CommaSkill } from "../../skills/grammar/CommaSkill.ts";
import { ConjugationSkill } from "../../skills/grammar/ConjugationSkill.ts";
import { ExtraneousElementSkill } from "../../skills/grammar/ExtraneousElementSkill.ts";
import { InfinitiveSkill } from "../../skills/grammar/InfinitiveSkill.ts";
import { PartizipIISkill } from "../../skills/grammar/PartizipIISkill.ts";
import { QuestionInversionSkill } from "../../skills/grammar/QuestionInversionSkill.ts";
import { QuestionWordSkill } from "../../skills/grammar/QuestionWordSkill.ts";
import { RelativePronounSkill } from "../../skills/grammar/RelativePronounSkill.ts";
import { VerbLemmaSkill } from "../../skills/grammar/VerbLemmaSkill.ts";
import { VerbPositionSkill } from "../../skills/grammar/VerbPositionSkill.ts";
import { KombinationSkill } from "../../skills/matching/KombinationSkill.ts";
import { RichtigFalschSkill } from "../../skills/reading/RichtigFalschSkill.ts";
import { ZitatMatchSkill } from "../../skills/reading/ZitatMatchSkill.ts";
import { FullSentenceSkill } from "../../skills/semantic/FullSentenceSkill.ts";
import { InformationExpressedSkill } from "../../skills/semantic/InformationExpressedSkill.ts";
import { MeaningSkill } from "../../skills/semantic/MeaningSkill.ts";
import { CompoundPartsSkill } from "../../skills/wortbildung/CompoundPartsSkill.ts";
import { DerivationSkill } from "../../skills/wortbildung/DerivationSkill.ts";
import { deklinationProfile } from "../../profiles/deklination.ts";
import { ergaenzenProfile } from "../../profiles/ergaenzen.ts";
import { fragenStellenProfile } from "../../profiles/fragenStellen.ts";
import { fragenZumTextProfile } from "../../profiles/fragenZumText.ts";
import { gegenteilProfile } from "../../profiles/gegenteil.ts";
import { kombinierenProfile } from "../../profiles/kombinieren.ts";
import { kompositumBildenProfile } from "../../profiles/kompositumBilden.ts";
import { kompositumLoesenProfile } from "../../profiles/kompositumLoesen.ts";
import { konnektorenProfile } from "../../profiles/konnektoren.ts";
import { modalverbStandardProfile } from "../../profiles/modalverbStandard.ts";
import { passivPraesensProfile } from "../../profiles/passivPraesens.ts";
import { passivPraeteritumProfile } from "../../profiles/passivPraeteritum.ts";
import { richtigFalschZitatProfile } from "../../profiles/richtigFalschZitat.ts";
import { satzbauFinalProfile } from "../../profiles/satzbauFinal.ts";
import { satzbauKausalProfile } from "../../profiles/satzbauKausal.ts";
import { satzbauKonditionalProfile } from "../../profiles/satzbauKonditional.ts";
import { satzbauKonzessivProfile } from "../../profiles/satzbauKonzessiv.ts";
import { satzbauRelativProfile } from "../../profiles/satzbauRelativ.ts";
import { satzbauTemporalProfile } from "../../profiles/satzbauTemporal.ts";
import { synonymProfile } from "../../profiles/synonym.ts";
import { tempusFuturProfile } from "../../profiles/tempusFutur.ts";
import { tempusPerfektProfile } from "../../profiles/tempusPerfekt.ts";
import { tempusPraesensProfile } from "../../profiles/tempusPraesens.ts";
import { tempusPraeteritumProfile } from "../../profiles/tempusPraeteritum.ts";
import { titelProfile } from "../../profiles/titel.ts";
import { uebersetzungProfile } from "../../profiles/uebersetzung.ts";
import { wortableitungProfile } from "../../profiles/wortableitung.ts";

/**
 * Builds an Engine with EVERY skill and profile this library ships
 * registered — the composition bac-voyage (or any consumer of the whole
 * catalogue) actually wants, rather than requiring 30+ manual .add() calls.
 * It calls createEngine() (the library's own composition root) and layers
 * registration on top — it does not reimplement or bypass it.
 */
export function createFullyLoadedEngine(): EngineParts {
  const parts = createEngine();

  parts.skills
    .add(new ExactMatchSkill())
    .add(new AuxiliaryVerbSkill())
    .add(new PartizipIISkill())
    .add(new ConjugationSkill())
    .add(new VerbLemmaSkill())
    .add(new ExtraneousElementSkill())
    .add(new InfinitiveSkill())
    .add(new VerbPositionSkill())
    .add(new CommaSkill())
    .add(new RelativePronounSkill())
    .add(new QuestionWordSkill())
    .add(new QuestionInversionSkill())
    .add(new MeaningSkill())
    .add(new InformationExpressedSkill())
    .add(new FullSentenceSkill())
    .add(new RichtigFalschSkill())
    .add(new ZitatMatchSkill())
    .add(new KombinationSkill())
    .add(new ConnectorSkill())
    .add(new DeclensionEndingSkill())
    .add(new CompoundPartsSkill())
    .add(new DerivationSkill());

  parts.profiles
    .add(synonymProfile)
    .add(gegenteilProfile)
    .add(titelProfile)
    .add(uebersetzungProfile)
    .add(richtigFalschZitatProfile)
    .add(fragenZumTextProfile)
    .add(kombinierenProfile)
    .add(kompositumBildenProfile)
    .add(kompositumLoesenProfile)
    .add(wortableitungProfile)
    .add(ergaenzenProfile)
    .add(tempusPerfektProfile)
    .add(tempusPraesensProfile)
    .add(tempusPraeteritumProfile)
    .add(tempusFuturProfile)
    .add(passivPraesensProfile)
    .add(passivPraeteritumProfile)
    .add(modalverbStandardProfile)
    .add(satzbauTemporalProfile)
    .add(satzbauFinalProfile)
    .add(satzbauKausalProfile)
    .add(satzbauKonditionalProfile)
    .add(satzbauKonzessivProfile)
    .add(satzbauRelativProfile)
    .add(konnektorenProfile)
    .add(deklinationProfile)
    .add(fragenStellenProfile);

  return parts;
}
