import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import {
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader,
  Download,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { extractBehaviorsFromPDF, validateExtractedBehavior } from '@/lib/pdf-import';
import { BehaviorEntry } from '@/types';

interface PDFImportProps {
  apiKey: string;
  onBehaviorsExtracted: (behaviors: Partial<BehaviorEntry>[]) => void;
  onClose: () => void;
}

interface ExtractedBehaviorWithStatus {
  behavior: Partial<BehaviorEntry>;
  valid: boolean;
  errors: string[];
  selected: boolean;
}

export default function PDFImport({
  apiKey,
  onBehaviorsExtracted,
  onClose,
}: PDFImportProps) {
  const { t, i18n } = useTranslation('common');
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [extractedBehaviors, setExtractedBehaviors] = useState<ExtractedBehaviorWithStatus[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'complete'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [rawText, setRawText] = useState('');

  const isSpanish = i18n.language === 'es';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter(
      (file) => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      setError(isSpanish ? 'Por favor selecciona archivos PDF' : 'Please select PDF files');
      return;
    }

    setFiles(pdfFiles);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(
      (file) => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );

    if (pdfFiles.length > 0) {
      setFiles(pdfFiles);
      setError(null);
    } else {
      setError(isSpanish ? 'Por favor suelta archivos PDF' : 'Please drop PDF files');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleProcessFiles = async () => {
    if (files.length === 0 || !apiKey) return;

    setProcessing(true);
    setError(null);
    const allBehaviors: ExtractedBehaviorWithStatus[] = [];
    let combinedRawText = '';

    try {
      for (const file of files) {
        const result = await extractBehaviorsFromPDF(file, apiKey, i18n.language as 'en' | 'es');

        if (!result.success) {
          throw new Error(result.error || 'Failed to process PDF');
        }

        if (result.rawText) {
          combinedRawText += `\n\n=== ${file.name} ===\n${result.rawText}`;
        }

        // Validate and add behaviors
        result.behaviors.forEach((behavior) => {
          const validation = validateExtractedBehavior(behavior);
          allBehaviors.push({
            behavior,
            valid: validation.valid,
            errors: validation.errors,
            selected: validation.valid, // Auto-select valid behaviors
          });
        });
      }

      setRawText(combinedRawText);
      setExtractedBehaviors(allBehaviors);
      setCurrentStep('review');
    } catch (err: any) {
      setError(err.message || (isSpanish ? 'Error procesando PDFs' : 'Error processing PDFs'));
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setExtractedBehaviors((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleRemove = (index: number) => {
    setExtractedBehaviors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    const selectedBehaviors = extractedBehaviors
      .filter((item) => item.selected && item.valid)
      .map((item) => item.behavior);

    if (selectedBehaviors.length === 0) {
      setError(
        isSpanish
          ? 'No hay comportamientos válidos seleccionados'
          : 'No valid behaviors selected'
      );
      return;
    }

    onBehaviorsExtracted(selectedBehaviors);
    setCurrentStep('complete');
  };

  const selectedCount = extractedBehaviors.filter((b) => b.selected).length;
  const validCount = extractedBehaviors.filter((b) => b.valid).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isSpanish ? 'Importar Reportes PDF' : 'Import PDF Reports'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentStep === 'upload' &&
                  (isSpanish
                    ? 'Sube reportes ABA en formato PDF'
                    : 'Upload ABA reports in PDF format')}
                {currentStep === 'review' &&
                  (isSpanish
                    ? `${extractedBehaviors.length} comportamientos extraídos`
                    : `${extractedBehaviors.length} behaviors extracted`)}
                {currentStep === 'complete' &&
                  (isSpanish ? '¡Importación completada!' : 'Import completed!')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Step */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {isSpanish ? 'Arrastra PDFs aquí o haz clic para seleccionar' : 'Drag PDFs here or click to select'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isSpanish
                      ? 'Soporta múltiples archivos PDF'
                      : 'Supports multiple PDF files'}
                  </p>
                </label>
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {isSpanish ? 'Archivos seleccionados:' : 'Selected files:'}
                  </h4>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                  {isSpanish ? '¿Qué datos se extraerán?' : 'What data will be extracted?'}
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• {isSpanish ? 'Fecha y hora' : 'Date and time'}</li>
                  <li>• {isSpanish ? 'Antecedentes, conductas y consecuencias (ABC)' : 'Antecedents, behaviors, and consequences (ABC)'}</li>
                  <li>• {isSpanish ? 'Nivel de severidad' : 'Severity level'}</li>
                  <li>• {isSpanish ? 'Función del comportamiento' : 'Behavior function'}</li>
                  <li>• {isSpanish ? 'Duración, ubicación y notas' : 'Duration, location, and notes'}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isSpanish
                      ? `${selectedCount} de ${extractedBehaviors.length} seleccionados • ${validCount} válidos`
                      : `${selectedCount} of ${extractedBehaviors.length} selected • ${validCount} valid`}
                  </p>
                </div>
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {isSpanish ? 'Datos crudos' : 'Raw data'}
                </button>
              </div>

              {showRawData && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {rawText}
                  </pre>
                </div>
              )}

              {/* Extracted Behaviors */}
              <div className="space-y-3">
                {extractedBehaviors.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      item.selected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    } ${!item.valid ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleSelect(index)}
                        disabled={!item.valid}
                        className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {item.behavior.behavior || (isSpanish ? 'Sin descripción' : 'No description')}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.behavior.date} • {item.behavior.time}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.valid ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-orange-600" />
                            )}
                            <button
                              onClick={() => handleRemove(index)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {isSpanish ? 'Antecedente:' : 'Antecedent:'}
                            </span>
                            <p className="text-gray-600 dark:text-gray-400">
                              {item.behavior.antecedent || '-'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {isSpanish ? 'Consecuencia:' : 'Consequence:'}
                            </span>
                            <p className="text-gray-600 dark:text-gray-400">
                              {item.behavior.consequence || '-'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {isSpanish ? 'Severidad:' : 'Severity:'}
                            </span>
                            <p className="text-gray-600 dark:text-gray-400">
                              {item.behavior.severity || '-'} • {item.behavior.function || '-'}
                            </p>
                          </div>
                        </div>

                        {item.errors.length > 0 && (
                          <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                            <p className="text-xs text-orange-800 dark:text-orange-400">
                              {isSpanish ? 'Problemas: ' : 'Issues: '}
                              {item.errors.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {isSpanish ? '¡Importación Exitosa!' : 'Import Successful!'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isSpanish
                  ? `${selectedCount} comportamiento${selectedCount !== 1 ? 's' : ''} importado${selectedCount !== 1 ? 's' : ''} correctamente`
                  : `${selectedCount} behavior${selectedCount !== 1 ? 's' : ''} imported successfully`}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {isSpanish ? 'Cerrar' : 'Close'}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {currentStep === 'upload' && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isSpanish ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleProcessFiles}
                disabled={files.length === 0 || processing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {isSpanish ? 'Procesando...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    {isSpanish ? 'Procesar PDFs' : 'Process PDFs'}
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('upload')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isSpanish ? 'Volver' : 'Back'}
              </button>
              <button
                onClick={handleImport}
                disabled={selectedCount === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                {isSpanish
                  ? `Importar ${selectedCount} comportamiento${selectedCount !== 1 ? 's' : ''}`
                  : `Import ${selectedCount} behavior${selectedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
