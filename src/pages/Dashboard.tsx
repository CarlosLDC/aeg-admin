import React from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';

const { Text } = Typography;
import { ArrowUpOutlined, DesktopOutlined, SyncOutlined, AlertOutlined } from '@ant-design/icons';

import PageContainer from '../components/PageContainer';

const Dashboard: React.FC = () => {
    return (
        <PageContainer title="Resumen del Panel">

            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
                    <Card style={{ width: '100%', height: '100%' }}>
                        <Statistic
                            title="Máquinas Activas"
                            value={1128}
                            prefix={<DesktopOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
                    <Card style={{ width: '100%', height: '100%' }}>
                        <Statistic
                            title="Tasa de Sincronización"
                            value={98.9}
                            precision={2}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<ArrowUpOutlined />}
                            suffix="%"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
                    <Card style={{ width: '100%', height: '100%' }}>
                        <Statistic
                            title="Sincronizaciones Pendientes"
                            value={45}
                            prefix={<SyncOutlined spin />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
                    <Card style={{ width: '100%', height: '100%' }}>
                        <Statistic
                            title="Alertas"
                            value={12}
                            valueStyle={{ color: '#ff4d4f' }}
                            prefix={<AlertOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Placeholder for future charts or activity feed */}
            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col span={24}>
                    <Card style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text type="secondary">
                            Espacio para Gráficos de Análisis
                        </Text>
                    </Card>
                </Col>
            </Row>
        </PageContainer>
    );
};

export default Dashboard;

