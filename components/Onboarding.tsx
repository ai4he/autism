import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import {
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Target,
  TrendingUp,
  Heart,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Video,
  Mic,
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const { t, i18n } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState(0);

  const isSpanish = i18n.language === 'es';

  const steps = [
    {
      title: isSpanish ? '¡Bienvenido!' : 'Welcome!',
      icon: Heart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      content: isSpanish ? (
        <>
          <p className="text-lg mb-4">
            Esta aplicación está diseñada para ayudarte a <strong>comprender y apoyar mejor</strong> a tu hijo/a utilizando principios del{' '}
            <strong>Análisis Aplicado de la Conducta (ABA)</strong>.
          </p>
          <p className="mb-4">
            No necesitas ser un experto. Te guiaremos paso a paso para que puedas:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Registrar comportamientos de manera efectiva</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Entender por qué ocurren ciertos comportamientos</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Ver patrones y progreso en el tiempo</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Trabajar mejor con terapeutas y profesionales</span>
            </li>
          </ul>
        </>
      ) : (
        <>
          <p className="text-lg mb-4">
            This app is designed to help you <strong>better understand and support</strong> your child using{' '}
            <strong>Applied Behavior Analysis (ABA)</strong> principles.
          </p>
          <p className="mb-4">
            You don't need to be an expert. We'll guide you step by step so you can:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Record behaviors effectively</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Understand why certain behaviors occur</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>See patterns and progress over time</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Work better with therapists and professionals</span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: isSpanish ? '¿Qué es ABA?' : 'What is ABA?',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      content: isSpanish ? (
        <>
          <p className="text-lg mb-4">
            <strong>ABA (Análisis Aplicado de la Conducta)</strong> es una ciencia basada en evidencia que ayuda a entender cómo funciona el comportamiento.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4">
            <p className="font-semibold mb-2">La idea principal es simple:</p>
            <p>
              Todo comportamiento tiene una <strong>razón</strong>. Cuando entendemos esa razón, podemos ayudar mejor a nuestros hijos.
            </p>
          </div>

          <p className="mb-4">
            ABA nos enseña a observar <strong>objetivamente</strong> (sin juzgar) y a buscar patrones. Esto nos ayuda a:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Prevenir comportamientos desafiantes antes de que ocurran</span>
            </li>
            <li className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Enseñar nuevas habilidades de forma efectiva</span>
            </li>
            <li className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Mejorar la comunicación y la independencia</span>
            </li>
          </ul>
        </>
      ) : (
        <>
          <p className="text-lg mb-4">
            <strong>ABA (Applied Behavior Analysis)</strong> is an evidence-based science that helps understand how behavior works.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4">
            <p className="font-semibold mb-2">The main idea is simple:</p>
            <p>
              Every behavior has a <strong>reason</strong>. When we understand that reason, we can better help our children.
            </p>
          </div>

          <p className="mb-4">
            ABA teaches us to observe <strong>objectively</strong> (without judgment) and look for patterns. This helps us:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Prevent challenging behaviors before they occur</span>
            </li>
            <li className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Teach new skills effectively</span>
            </li>
            <li className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Improve communication and independence</span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: isSpanish ? 'El Método ABC' : 'The ABC Method',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      content: isSpanish ? (
        <>
          <p className="text-lg mb-4">
            El método ABC es la base para entender cualquier comportamiento. Es como contar una historia completa:
          </p>

          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4">
              <h4 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">
                A - Antecedente
              </h4>
              <p className="text-sm mb-2">¿Qué pasó JUSTO ANTES del comportamiento?</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Ejemplo: "Le pedí que guardara sus juguetes para ir a cenar"
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
              <h4 className="font-semibold text-red-900 dark:text-red-400 mb-2">
                B - Comportamiento (Behavior)
              </h4>
              <p className="text-sm mb-2">¿Qué hizo específicamente? (lo que vimos/oímos)</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Ejemplo: "Tiró los juguetes al suelo y gritó 'No quiero'"
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                C - Consecuencia
              </h4>
              <p className="text-sm mb-2">¿Qué pasó INMEDIATAMENTE DESPUÉS?</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Ejemplo: "Le dije que podía jugar 5 minutos más antes de guardar"
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm">
              <strong>💡 Tip importante:</strong> Sé específico y objetivo. Escribe lo que viste/oíste, no lo que piensas que sintió.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-lg mb-4">
            The ABC method is the foundation for understanding any behavior. It's like telling a complete story:
          </p>

          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4">
              <h4 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">
                A - Antecedent
              </h4>
              <p className="text-sm mb-2">What happened RIGHT BEFORE the behavior?</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Example: "I asked them to put away toys for dinner"
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
              <h4 className="font-semibold text-red-900 dark:text-red-400 mb-2">
                B - Behavior
              </h4>
              <p className="text-sm mb-2">What did they specifically do? (what we saw/heard)</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Example: "Threw toys on the floor and yelled 'I don't want to'"
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                C - Consequence
              </h4>
              <p className="text-sm mb-2">What happened IMMEDIATELY AFTER?</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Example: "I told them they could play 5 more minutes before cleaning"
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm">
              <strong>💡 Important tip:</strong> Be specific and objective. Write what you saw/heard, not what you think they felt.
            </p>
          </div>
        </>
      ),
    },
    {
      title: isSpanish ? '¿Por qué ocurren los comportamientos?' : 'Why Do Behaviors Happen?',
      icon: AlertCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      content: isSpanish ? (
        <>
          <p className="text-lg mb-4">
            En ABA, identificamos que todos los comportamientos tienen una de estas <strong>4 funciones</strong>:
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="font-semibold text-red-900 dark:text-red-400 mb-1">
                🚪 Escape/Evitación
              </h4>
              <p className="text-sm">Para salir de una situación o evitar algo que no le gusta</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1">
                Ej: Hacer berrinche para no hacer tarea
              </p>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-400 mb-1">
                👋 Atención
              </h4>
              <p className="text-sm">Para obtener atención de otros (incluso atención negativa)</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1">
                Ej: Gritar cuando mamá/papá está en el teléfono
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">
                🎁 Tangible/Acceso
              </h4>
              <p className="text-sm">Para obtener algo que quiere (juguete, comida, actividad)</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1">
                Ej: Llorar hasta que le den el tablet
              </p>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-400 mb-1">
                ✨ Sensorial
              </h4>
              <p className="text-sm">Para obtener estimulación sensorial o autorregularse</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1">
                Ej: Mecerse repetidamente para calmarse
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-sm">
              <strong>🎯 ¿Por qué es importante?</strong> Cuando sabes la función, puedes enseñar una forma más apropiada de conseguir lo mismo.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-lg mb-4">
            In ABA, we identify that all behaviors serve one of these <strong>4 functions</strong>:
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="font-semibold text-red-900 dark:text-red-400 mb-1">
                🚪 Escape/Avoidance
              </h4>
              <p className="text-sm">To get out of a situation or avoid something they don't like</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1">
                Ex: Tantrum to avoid homework
              </p>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-400 mb-1">
                👋 Attention
              </h4>
              <p className="text-sm">To get attention from others (even negative attention)</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1">
                Ex: Yelling when mom/dad is on the phone
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">
                🎁 Tangible/Access
              </h4>
              <p className="text-sm">To get something they want (toy, food, activity)</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1">
                Ex: Crying until they get the tablet
              </p>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-400 mb-1">
                ✨ Sensory
              </h4>
              <p className="text-sm">To get sensory stimulation or self-regulate</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1">
                Ex: Rocking repeatedly to calm down
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-sm">
              <strong>🎯 Why is this important?</strong> When you know the function, you can teach a more appropriate way to get the same result.
            </p>
          </div>
        </>
      ),
    },
    {
      title: isSpanish ? 'Formas de Registrar' : 'Ways to Record',
      icon: Mic,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      content: isSpanish ? (
        <>
          <p className="text-lg mb-4">
            Tenemos <strong>3 formas fáciles</strong> de registrar comportamientos:
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <BookOpen className="w-5 h-5 text-gray-600" />
                </div>
                <h4 className="font-semibold">Formulario Manual</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Llena cada campo del método ABC a tu ritmo. Ideal cuando tienes tiempo para detallar.
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Mic className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-semibold">Conversación por Voz</h4>
                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">NUEVO</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Habla naturalmente con la IA sobre lo que pasó. Ella te hará preguntas y llenará el formulario automáticamente.
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-400">
                ✨ Perfecto cuando estás ocupado o quieres registrar rápido
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Video className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold">Voz + Video</h4>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">NUEVO</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Habla mientras la cámara captura el comportamiento. La IA analiza lo que ve y lo que dices.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                🎥 Detecta emociones, intensidad y movimientos automáticamente
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm">
              <strong>💡 Consejo:</strong> Usa la que te sea más cómoda en el momento. ¡Lo importante es registrar!
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-lg mb-4">
            We have <strong>3 easy ways</strong> to record behaviors:
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <BookOpen className="w-5 h-5 text-gray-600" />
                </div>
                <h4 className="font-semibold">Manual Form</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fill each ABC method field at your pace. Ideal when you have time for details.
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Mic className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-semibold">Voice Conversation</h4>
                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">NEW</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Talk naturally with AI about what happened. It will ask questions and fill the form automatically.
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-400">
                ✨ Perfect when you're busy or want to record quickly
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Video className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold">Voice + Video</h4>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">NEW</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Talk while the camera captures the behavior. AI analyzes what it sees and what you say.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                🎥 Automatically detects emotions, intensity and movements
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm">
              <strong>💡 Tip:</strong> Use whichever is most comfortable at the moment. The important thing is to record!
            </p>
          </div>
        </>
      ),
    },
    {
      title: isSpanish ? '¿Por qué es importante registrar?' : 'Why is Recording Important?',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      content: isSpanish ? (
        <>
          <p className="text-lg mb-4">
            Registrar comportamientos de forma consistente es <strong>la clave del éxito</strong> en ABA. Aquí está el por qué:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Ver patrones ocultos</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los comportamientos que parecen aleatorios a menudo siguen patrones (hora del día, actividad, personas presentes)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Medir el progreso real</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los datos te muestran si las estrategias están funcionando o necesitan ajustarse
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Comunicación con profesionales</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los terapeutas y médicos pueden ayudar mucho mejor cuando tienen datos concretos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Celebrar los logros</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ver gráficas que muestran mejoras es motivador para toda la familia
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
            <p className="font-semibold mb-2">🎯 Meta sugerida:</p>
            <p className="text-sm">
              Intenta registrar comportamientos durante <strong>2 semanas seguidas</strong>. Verás patrones que no imaginabas y tendrás información valiosa para tomar decisiones.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-lg mb-4">
            Consistently recording behaviors is <strong>the key to success</strong> in ABA. Here's why:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">See hidden patterns</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Behaviors that seem random often follow patterns (time of day, activity, people present)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Measure real progress</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Data shows you if strategies are working or need adjustment
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Communication with professionals</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Therapists and doctors can help much better when they have concrete data
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Celebrate achievements</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Seeing charts that show improvements is motivating for the whole family
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
            <p className="font-semibold mb-2">🎯 Suggested goal:</p>
            <p className="text-sm">
              Try recording behaviors for <strong>2 consecutive weeks</strong>. You'll see patterns you didn't imagine and have valuable information for decision-making.
            </p>
          </div>
        </>
      ),
    },
    {
      title: isSpanish ? '¡Estás listo para empezar!' : 'You\'re Ready to Start!',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      content: isSpanish ? (
        <>
          <p className="text-lg mb-4">
            Recuerda: <strong>No tienes que ser perfecto</strong>. Lo importante es empezar y ser consistente.
          </p>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
            <h4 className="font-semibold mb-3 text-purple-900 dark:text-purple-400">
              💪 Consejos para el éxito:
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Registra lo antes posible después del comportamiento (mientras está fresco)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Sé objetivo: describe lo que viste/oíste, no interpretes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Usa la entrada por voz cuando estés ocupado - es rápida y fácil</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Revisa las gráficas semanalmente para ver patrones</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Comparte los datos con el terapeuta de tu hijo/a</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-sm">
              <strong>🔒 Privacidad:</strong> Todos tus datos se guardan solo en tu dispositivo. Nada se envía a servidores externos (excepto cuando usas la IA, y solo los datos que compartes en ese momento).
            </p>
          </div>

          <p className="text-center text-lg font-semibold text-pink-600 dark:text-pink-400">
            ¡Estás haciendo un trabajo increíble apoyando a tu hijo/a! 💖
          </p>
        </>
      ) : (
        <>
          <p className="text-lg mb-4">
            Remember: <strong>You don't have to be perfect</strong>. The important thing is to start and be consistent.
          </p>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
            <h4 className="font-semibold mb-3 text-purple-900 dark:text-purple-400">
              💪 Tips for success:
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Record as soon as possible after the behavior (while it's fresh)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Be objective: describe what you saw/heard, don't interpret</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Use voice input when you're busy - it's quick and easy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Review charts weekly to see patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Share data with your child's therapist</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-sm">
              <strong>🔒 Privacy:</strong> All your data is saved only on your device. Nothing is sent to external servers (except when you use AI, and only the data you share at that moment).
            </p>
          </div>

          <p className="text-center text-lg font-semibold text-pink-600 dark:text-pink-400">
            You're doing an amazing job supporting your child! 💖
          </p>
        </>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b border-gray-200 dark:border-gray-700 ${currentStepData.bgColor}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-white dark:bg-gray-800 rounded-lg shadow`}>
                <StepIcon className={`w-8 h-8 ${currentStepData.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {currentStepData.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isSpanish ? 'Paso' : 'Step'} {currentStep + 1} {isSpanish ? 'de' : 'of'} {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose dark:prose-invert max-w-none">
            {currentStepData.content}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {isSpanish ? 'Anterior' : 'Previous'}
            </button>

            <div className="flex gap-2">
              <button
                onClick={onSkip}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {isSpanish ? 'Saltar tutorial' : 'Skip tutorial'}
              </button>

              {isLastStep ? (
                <button
                  onClick={onComplete}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  {isSpanish ? '¡Empezar!' : 'Get Started!'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  {isSpanish ? 'Siguiente' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
