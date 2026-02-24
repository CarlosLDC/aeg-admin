import React, { useState, useEffect } from 'react';
import { Card, Typography, Form, Input, Button, Avatar, Upload, message, Space, Tag, Divider, Row, Col, Tooltip } from 'antd';
import { UserOutlined, UploadOutlined, SaveOutlined, MailOutlined, InfoCircleOutlined } from '@ant-design/icons';
import PageContainer from '../components/PageContainer';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
    const { profile, user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (profile) {
            form.setFieldsValue({
                nombre: profile.nombre,
            });
        }
    }, [profile, form]);

    const handleUpdateProfile = async (values: { nombre: string }) => {
        if (!user || loading) {
            console.log('⚠️ Actualización bloqueada:', { user: !!user, loading });
            return;
        }

        try {
            setLoading(true);
            message.loading({ content: 'Guardando cambios...', key: 'profile-update' });

            console.log('📝 Datos del formulario:', values);
            console.log('👤 Usuario actual:', user.id);

            await profileService.updateProfile({ nombre: values.nombre });
            console.log('✅ Update en BD completado. Refrescando contexto...');

            await refreshProfile();
            console.log('🔄 Contexto refrescado. ¡Éxito!');

            message.success({ content: 'Perfil actualizado correctamente', key: 'profile-update' });
        } catch (error: any) {
            console.error('❌ Error en handleUpdateProfile:', error);
            message.error({ content: 'Error al actualizar perfil: ' + error.message, key: 'profile-update' });
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAvatar = async (options: any) => {
        const { file, onSuccess, onError } = options;
        if (!user) return;

        try {
            setUploading(true);
            const publicUrl = await profileService.uploadAvatar(user.id, file as File);
            await profileService.updateProfile({ foto_perfil: publicUrl });
            await refreshProfile();
            message.success({ content: 'Foto de perfil actualizada', key: 'avatar-update' });
            onSuccess(null, file);
        } catch (error: any) {
            message.error({ content: 'Error al subir imagen: ' + error.message, key: 'avatar-error' });
            onError(error);
        } finally {
            setUploading(false);
        }
    };

    const getRoleColor = (rol: string) => {
        switch (rol) {
            case 'admin': return 'gold';
            case 'viewer': return 'blue';
            default: return 'default';
        }
    };

    return (
        <PageContainer title="Configuración de Cuenta">

            <Row gutter={[24, 24]} style={{ display: 'flex', alignItems: 'stretch' }}>
                <Col xs={24} lg={8} style={{ display: 'flex' }}>
                    <Card style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <Avatar
                                size={120}
                                src={profile?.foto_perfil}
                                icon={<UserOutlined />}
                                style={{ border: '4px solid var(--border-color)' }}
                            />
                            <div>
                                <Title level={4} style={{ margin: 0 }}>{profile?.nombre || 'Usuario'}</Title>
                                <Text type="secondary">{user?.email}</Text>
                            </div>
                            <Tooltip title={
                                <span>
                                    Tu rol de <b>{profile?.rol || '...'}</b> define tus permisos en el sistema.
                                    Si necesitas un cambio de rol, contacta al administrador.
                                </span>
                            }>
                                <Tag
                                    color={getRoleColor(profile?.rol || '')}
                                    style={{ textTransform: 'uppercase', cursor: 'help' }}
                                    icon={<InfoCircleOutlined />}
                                >
                                    {profile?.rol || (profile === null ? 'Sin Perfil' : 'Cargando...')}
                                </Tag>
                            </Tooltip>
                            <Divider style={{ margin: '12px 0' }} />
                            <Upload
                                customRequest={handleUploadAvatar}
                                showUploadList={false}
                                accept="image/*"
                            >
                                <Button icon={<UploadOutlined />} loading={uploading}>
                                    Cambiar Foto
                                </Button>
                            </Upload>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={16} style={{ display: 'flex' }}>
                    <Card title="Información Personal" style={{ width: '100%' }}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdateProfile}
                            requiredMark={false}
                        >
                            <Form.Item
                                name="nombre"
                                label="Nombre Completo"
                                rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                            >
                                <Input placeholder="Tu nombre" size="large" />
                            </Form.Item>

                            <Form.Item
                                label="Correo Electrónico"
                                tooltip="El correo electrónico no se puede cambiar desde este panel"
                            >
                                <Input
                                    value={user?.email}
                                    disabled
                                    size="large"
                                    prefix={<MailOutlined style={{ color: 'var(--text-secondary)' }} />}
                                />
                            </Form.Item>

                            <Form.Item style={{ marginTop: '32px' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={loading}
                                    size="large"
                                >
                                    Guardar Cambios
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </PageContainer>
    );
};

export default ProfilePage;
