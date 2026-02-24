import React, { useState } from 'react';
import { Typography, Form, Input, Button, Alert } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        try {
            setErrorMsg(null);
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (error) {
                throw error;
            }

            navigate('/');
        } catch (error: any) {
            setErrorMsg(error.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--bg-main)',
            padding: '24px'
        }}>
            <div className="fade-in" style={{
                width: '100%',
                maxWidth: '400px',
                background: 'var(--bg-surface)',
                padding: '40px',
                borderRadius: 'var(--radius-sleek)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)' // We keep a subtle shadow here to lift the card from the background
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Title level={2} style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                        AEG Admin
                    </Title>
                    <Text style={{ color: 'var(--text-secondary)', fontFamily: 'Inter' }}>
                        Inicia sesión para acceder al panel fiscal
                    </Text>
                </div>

                {errorMsg && (
                    <Alert
                        message={errorMsg}
                        type="error"
                        showIcon
                        style={{ marginBottom: '24px', borderRadius: 'var(--radius-sleek)' }}
                    />
                )}

                <Form
                    name="login"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    layout="vertical"
                    requiredMark={false}
                    validateTrigger="onBlur"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Por favor ingresa tu correo electrónico' },
                            { type: 'email', message: 'Ingresa un correo válido' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: 'var(--text-secondary)' }} />}
                            placeholder="Correo Electrónico"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }} />}
                            placeholder="Contraseña"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: '32px', marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" size="large" loading={loading} block>
                            Ingresar
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default LoginPage;
