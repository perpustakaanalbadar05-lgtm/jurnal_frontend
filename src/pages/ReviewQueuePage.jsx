import { useState, useEffect } from 'react'
import { reviewService } from '../services/reviewService'
import { paperService } from '../services/paperService'
import { StatusBadge, DecisionBadge } from '../components/Badge'
import { TableSkeleton } from '../components/Loader'
import { Modal } from '../components/Modal'
import { formatDate, DECISION_LABELS } from '../utils/helpers'
import toast from 'react-hot-toast'
import DiscussionPanel from '../components/DiscussionPanel'

const DECISIONS = ['accept', 'minor_revision', 'major_revision', 'reject']

export default function ReviewQueuePage() {
  const [queue, setQueue] = useState([])
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('queue') // 'queue' or 'history'
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [form, setForm] = useState({ comment: '', private_comment: '', decision: 'accept', file: null, word_file: null })
  const [submitting, setSubmitting] = useState(false)

  const fetchQueue = () => {
    setLoading(true)
    reviewService.getMyQueue()
      .then(setQueue)
      .finally(() => setLoading(false))
  }

  const fetchHistory = () => {
    setLoading(true)
    reviewService.getMyHistory()
      .then(setHistory)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueue()
    } else {
      fetchHistory()
    }
  }, [activeTab])

  const openReviewModal = (paper) => {
    setReviewModal(paper)
    setForm({ comment: '', private_comment: '', decision: 'accept', file: null, word_file: null })
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!form.comment.trim()) {
      toast.error('Komentar review wajib diisi')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('paper_id', reviewModal.id)
      formData.append('comment', form.comment)
      formData.append('private_comment', form.private_comment || '')
      formData.append('decision', form.decision)
      if (form.file) {
        formData.append('file', form.file)
      }
      if (form.word_file) {
        formData.append('word_file', form.word_file)
      }

      await reviewService.submit(formData)
      toast.success('Review berhasil disubmit! 🎉')
      setReviewModal(null)
      fetchQueue()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const decisionConfig = {
    accept: { label: '✅ Diterima', class: 'border-green-300 bg-green-50 text-green-800' },
    minor_revision: { label: '✏️ Revisi Minor', class: 'border-orange-300 bg-orange-50 text-orange-800' },
    major_revision: { label: '⚠️ Revisi Mayor', class: 'border-red-300 bg-red-50 text-red-800' },
    reject: { label: '❌ Ditolak', class: 'border-red-400 bg-red-50 text-red-700' },
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Penugasan Review 🔍</h1>
        <p className="page-subtitle">Kelola penugasan aktif dan lihat riwayat review Anda</p>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 mb-6 flex gap-1 max-w-md">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
            ${activeTab === 'queue'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
        >
          📥 Antrian Aktif ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
            ${activeTab === 'history'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
        >
          📜 Riwayat Review ({history.length})
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : activeTab === 'queue' ? (
        queue.length === 0 ? (
          <div className="card card-body text-center py-16">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-semibold text-gray-700 mb-2">Tidak ada paper untuk direview</h3>
            <p className="text-gray-400 text-sm">Semua paper sudah direview atau belum ada penugasan baru</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((paper) => (
              <div key={paper.id} className="card card-body">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl flex-shrink-0">
                    🔍
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1">
                        <button 
                          onClick={() => setDetailModal(paper)} 
                          className="text-left hover:text-primary transition-colors focus:outline-none focus:underline"
                        >
                          {paper.title}
                        </button>
                      </h3>
                      <StatusBadge status={paper.status} />
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-3">{paper.abstract}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <span className="text-primary font-medium" title="Sistem Double-Blind Review aktif">🙈 Penulis Dirahasiakan</span>
                      <span>📅 {formatDate(paper.created_at)}</span>
                      {paper.keywords && <span>🏷️ {paper.keywords}</span>}
                    </div>

                    {/* Co-authors are hidden for double-blind review */}
                  </div>

                  <div className="flex flex-wrap gap-2 flex-shrink-0 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {paper.file_path && (
                      <button
                        onClick={() => paperService.download(paper.id, paper.file_name)}
                        className="btn btn-sm btn-ghost flex-1 sm:flex-none justify-center"
                        title="Download PDF"
                      >📥 PDF</button>
                    )}
                    {paper.word_file_path && (
                      <button
                        onClick={() => paperService.downloadWord(paper.id, paper.word_file_name)}
                        className="btn btn-sm btn-ghost text-primary flex-1 sm:flex-none justify-center"
                        title="Download Word"
                      >📝 Word</button>
                    )}
                    <button
                      onClick={() => openReviewModal(paper)}
                      className="btn btn-sm btn-primary flex-1 sm:flex-none justify-center"
                      id={`btn-review-${paper.id}`}
                    >
                      ✍️ Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        history.length === 0 ? (
          <div className="card card-body text-center py-16">
            <div className="text-5xl mb-4">📜</div>
            <h3 className="font-semibold text-gray-700 mb-2">Belum ada riwayat review</h3>
            <p className="text-gray-400 text-sm">Anda belum menyelesaikan review untuk paper apapun</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((paper) => (
              <div key={paper.id} className="card card-body">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center justify-center text-2xl flex-shrink-0">
                    ✅
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1">
                        <button 
                          onClick={() => setDetailModal(paper)} 
                          className="text-left hover:text-primary transition-colors focus:outline-none focus:underline"
                        >
                          {paper.title}
                        </button>
                      </h3>
                      <StatusBadge status={paper.status} />
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-3">{paper.abstract}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
                      <span className="text-primary font-medium">🙈 Penulis Dirahasiakan</span>
                      <span>📅 {formatDate(paper.created_at)}</span>
                      {paper.keywords && <span>🏷️ {paper.keywords}</span>}
                    </div>

                    {/* Review comments */}
                    {paper.reviews && paper.reviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-700 uppercase text-[10px] tracking-wide">💬 Ulasan Anda</span>
                          <DecisionBadge decision={rev.decision} />
                        </div>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{rev.comment}</p>
                        {rev.private_comment && (
                          <div className="p-2.5 bg-red-50/50 rounded-lg border border-red-100 text-[11px] text-red-800">
                            <span className="font-semibold uppercase text-[9px] tracking-wide block mb-0.5">🔐 Catatan Privat (Admin Only):</span>
                            {rev.private_comment}
                          </div>
                        )}
                        {(rev.file_path || rev.word_file_path) && (
                          <div className="pt-2 border-t border-gray-200/50 flex flex-wrap gap-2 justify-end">
                            {rev.file_path && (
                              <button
                                onClick={() => reviewService.download(rev.id, rev.file_name)}
                                className="btn btn-xs btn-primary gap-1 shadow-sm"
                              >
                                📥 Download PDF ({rev.file_name})
                              </button>
                            )}
                            {rev.word_file_path && (
                              <button
                                onClick={() => reviewService.downloadWord(rev.id, rev.word_file_name)}
                                className="btn btn-xs btn-outline border-primary text-primary hover:bg-primary hover:text-white gap-1 shadow-sm"
                              >
                                📝 Download Word ({rev.word_file_name})
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 flex-shrink-0 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {paper.file_path && (
                      <button
                        onClick={() => paperService.download(paper.id, paper.file_name)}
                        className="btn btn-sm btn-ghost flex-1 sm:flex-none justify-center"
                        title="Download PDF"
                      >📥 PDF Asli</button>
                    )}
                    {paper.word_file_path && (
                      <button
                        onClick={() => paperService.downloadWord(paper.id, paper.word_file_name)}
                        className="btn btn-sm btn-ghost text-primary flex-1 sm:flex-none justify-center"
                        title="Download Word"
                      >📝 Word Asli</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Detail Paper" size="lg">
        {detailModal && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{detailModal.title}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <StatusBadge status={detailModal.status} />
                <span className="badge bg-gray-100 text-gray-600">v{detailModal.version}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Abstrak</p>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">{detailModal.abstract}</p>
            </div>
            {detailModal.keywords && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {detailModal.keywords.split(',').map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-accent/20 text-amber-900 text-xs rounded-full">{kw.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Author Utama</p>
                <p className="text-gray-700 italic">Dirahasiakan (Double-Blind Review)</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Co-Authors</p>
                <p className="text-gray-700 italic">Dirahasiakan</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              {detailModal.file_path && (
                <button
                  onClick={() => paperService.download(detailModal.id, detailModal.file_name)}
                  className="btn-primary justify-center"
                >
                  📥 Download PDF
                </button>
              )}
              {detailModal.word_file_path && (
                <button
                  onClick={() => paperService.downloadWord(detailModal.id, detailModal.word_file_name)}
                  className="btn-outline border-primary text-primary hover:bg-primary hover:text-white justify-center"
                >
                  📝 Download Word
                </button>
              )}
            </div>

            <DiscussionPanel paperId={detailModal.id} />
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)} title="Submit Review" size="lg">
        {reviewModal && (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700">{reviewModal.title}</p>
              <p className="text-xs text-gray-400 mt-1 italic">Penulis dirahasiakan (Double-Blind Review)</p>
            </div>

            {/* Decision */}
            <div className="form-group">
              <label className="form-label">Keputusan Review *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DECISIONS.map(d => (
                  <label
                    key={d}
                    htmlFor={`decision-${d}`}
                    onClick={() => setForm({ ...form, decision: d })}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all relative
                      ${form.decision === d ? decisionConfig[d].class + ' border-opacity-100 ring-2 ring-offset-1 ring-primary/20' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <input
                      id={`decision-${d}`}
                      type="radio"
                      name="decision"
                      value={d}
                      checked={form.decision === d}
                      onChange={e => setForm({ ...form, decision: e.target.value })}
                      className="absolute opacity-0 pointer-events-none"
                    />
                    <span className="text-sm font-medium">{decisionConfig[d].label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="form-group">
              <label className="form-label" htmlFor="review-comment">Komentar untuk Author *</label>
              <textarea
                id="review-comment"
                value={form.comment}
                onChange={e => setForm({ ...form, comment: e.target.value })}
                className="form-textarea"
                rows={5}
                placeholder="Tulis komentar review yang akan dilihat oleh author..."
                required
              />
            </div>

            {/* Private comment */}
            <div className="form-group">
              <label className="form-label" htmlFor="review-private">Catatan Privat (hanya untuk Admin)</label>
              <textarea
                id="review-private"
                value={form.private_comment}
                onChange={e => setForm({ ...form, private_comment: e.target.value })}
                className="form-textarea"
                rows={3}
                placeholder="Catatan tambahan untuk admin (tidak terlihat oleh author)..."
              />
            </div>

            {/* File Upload (PDF) */}
            <div className="form-group">
              <label className="form-label" htmlFor="review-file">Upload File Revisi (PDF) - <span className="text-gray-400 font-normal">Opsional</span></label>
              <input
                id="review-file"
                type="file"
                accept=".pdf"
                onChange={e => setForm({ ...form, file: e.target.files[0] })}
                className="form-input block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all border border-gray-200 rounded-xl"
              />
              <p className="text-xs text-gray-400 mt-1">Menerima format .pdf (Max: 20MB)</p>
            </div>

            {/* File Upload (Word) */}
            <div className="form-group">
              <label className="form-label" htmlFor="review-word-file">Upload File Revisi (Word) - <span className="text-gray-400 font-normal">Opsional</span></label>
              <input
                id="review-word-file"
                type="file"
                accept=".doc,.docx"
                onChange={e => setForm({ ...form, word_file: e.target.files[0] })}
                className="form-input block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all border border-gray-200 rounded-xl"
              />
              <p className="text-xs text-gray-400 mt-1">Menerima format .doc atau .docx (Max: 20MB)</p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setReviewModal(null)} className="btn-ghost w-full sm:w-auto justify-center">Batal</button>
              <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto justify-center" id="btn-submit-review">
                {submitting ? 'Menyimpan...' : '🚀 Submit Review'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
