import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Form, ListGroup, Spinner } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import { API_URL } from '../config';
import BackButton from '../components/BackButton';
import PawButton from '../components/PawButton';

type PetFile = {
  id: number;
  pet_id: number;
  file_name: string;
  file_path: string; // e.g. /uploads/pets/<uuid>.pdf
  file_type: string | null;
  uploaded_at: string; // ISO string
};

const PERIWINKLE = '#CCCCFF';

const PetFiles: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken, sessionId } = useAuth();

  const [files, setFiles] = React.useState<PetFile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const fetchFiles = React.useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (sessionId) headers['Clerk-Session-Id'] = sessionId;

      const resp = await fetch(`${API_URL}/api/pets/${id}/files`, {
        headers,
        credentials: 'include',
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to fetch files');
      }
      const data = (await resp.json()) as PetFile[];
      setFiles(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [id, getToken, sessionId]);

  const onDelete = async (fileId: number) => {
    if (!id) return;
    const confirmed = window.confirm('Delete this file? This cannot be undone.');
    if (!confirmed) return;
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (sessionId) headers['Clerk-Session-Id'] = sessionId;

      const resp = await fetch(`${API_URL}/api/pets/${id}/files/${fileId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to delete file');
      }
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (e: any) {
      setError(e?.message || 'Failed to delete file');
    }
  };
  

  React.useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedFile) return;
    try {
      setError(null);
      setUploading(true);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      // Only PDFs allowed by backend
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file.');
        return;
        }

      const form = new FormData();
      form.append('file', selectedFile);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (sessionId) headers['Clerk-Session-Id'] = sessionId;

      const resp = await fetch(`${API_URL}/api/pets/${id}/files`, {
        method: 'POST',
        headers,
        body: form,
        credentials: 'include',
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to upload file');
      }
      // Refresh list
      setSelectedFile(null);
      await fetchFiles();
    } catch (e: any) {
      setError(e?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <BackButton onClick={() => navigate(`/pet/${id}`)} />
          <h1 className="mb-0 ms-3">Pet Files</h1>
        </div>
      </div>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
          className="mb-4"
        >
          {error}
        </Alert>
      )}

      {/* Upload Card */}
      <Card className="mb-4">
        <Card.Header
          className="d-flex align-items-center"
          style={{ backgroundColor: PERIWINKLE, color: '#000' }}
        >
          <h5 className="mb-0">Upload PDF</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={onUpload} className="d-flex flex-column flex-md-row gap-3 align-items-start">
            <Form.Group controlId="pdfUpload" className="flex-grow-1">
              <Form.Label>Select a PDF to upload</Form.Label>
              <Form.Control
                type="file"
                accept="application/pdf"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSelectedFile(e.currentTarget.files?.[0] || null)
                }
                disabled={uploading}
              />
              <Form.Text muted>Maximum size: 5MB</Form.Text>
            </Form.Group>
            <div className="mt-2 mt-md-4">
              <PawButton
                type="submit"
                variant="primary"
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <Spinner
                      animation="border"
                      size="sm"
                      className="me-2"
                      role="status"
                    />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </PawButton>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Files List */}
      <Card>
        <Card.Header
          className="d-flex align-items-center"
          style={{ backgroundColor: PERIWINKLE, color: '#000' }}
        >
          <h5 className="mb-0">Files</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="d-flex align-items-center">
              <Spinner animation="border" role="status" className="me-2">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <span>Loading files...</span>
            </div>
          ) : files.length === 0 ? (
            <Alert variant="info" className="mb-0">
              No files uploaded yet.
            </Alert>
          ) : (
            <ListGroup>
              {files.map((f) => (
                <ListGroup.Item key={f.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">{f.file_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                      Uploaded {new Date(f.uploaded_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="ms-3 d-flex gap-2">
                    <PawButton
                      onClick={() =>
                        window.open(`${API_URL}${f.file_path}`, '_blank', 'noopener,noreferrer')
                      }
                    >
                      Open
                    </PawButton>
                    <PawButton
                      variant="danger"
                      onClick={() => onDelete(f.id)}
                    >
                      Delete
                    </PawButton>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PetFiles;