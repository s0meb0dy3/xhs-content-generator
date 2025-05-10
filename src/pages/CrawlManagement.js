import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input, Table, Space, Typography, message, Tag, Modal } from 'antd';
import { PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const API_URL = 'https://api.coze.cn/v1/workflow/run';
const AUTH_TOKEN = 'pat_wBxRH66eSNFjZPp5A9WNMIJg5Ux8JJffhgjkArPPpj2DDdemVvQuVDQbIs47HaGY';
const WORKFLOW_ID_ADD_COOKIE = '7502647053794164799';
const WORKFLOW_ID_GET_COOKIES = '7502648298550198291';
const WORKFLOW_ID_DELETE_COOKIE = '7502655538469503027';
const WORKFLOW_ID_TEST_COOKIE = '7502646950479708169';

function CrawlManagement() {
  const [cookies, setCookies] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newCookie, setNewCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [testLoading, setTestLoading] = useState({});

  // 获取Cookie列表
  const fetchCookies = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameters: {},
          workflow_id: WORKFLOW_ID_GET_COOKIES
        })
      });

      const result = await response.json();
      if (result.code === 0) {
        const data = JSON.parse(result.data);
        const cookieList = data.outputList.map((item, index) => ({
          id: index + 1,
          cookie: item.cookie,
          createTime: item.bstudio_create_time,
          status: item.usable === 0 ? 'active' : 'inactive'
        }));
        setCookies(cookieList);
      } else {
        message.error('获取Cookie列表失败');
      }
    } catch (error) {
      message.error('获取Cookie列表出错');
      console.error('Error fetching cookies:', error);
    }
  };

  // 添加新Cookie
  const handleAddCookie = async () => {
    if (!newCookie.trim()) {
      message.warning('请输入Cookie');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameters: {
            cookie: newCookie.trim()
          },
          workflow_id: WORKFLOW_ID_ADD_COOKIE
        })
      });

      const result = await response.json();
      if (result.code === 0) {
        const data = JSON.parse(result.data);
        if (data.result === 1) {
          message.success('Cookie添加成功');
          setNewCookie('');
          setIsModalVisible(false);
          fetchCookies(); // 刷新列表
        } else {
          message.error('Cookie添加失败');
        }
      } else {
        message.error('Cookie添加失败');
      }
    } catch (error) {
      message.error('添加Cookie出错');
      console.error('Error adding cookie:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除Cookie
  const handleDeleteCookie = async (cookie) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个Cookie吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setDeleteLoading(true);
        try {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${AUTH_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              parameters: {
                cookie: cookie
              },
              workflow_id: WORKFLOW_ID_DELETE_COOKIE
            })
          });

          const result = await response.json();
          if (result.code === 0) {
            message.success('Cookie删除成功');
            fetchCookies(); // 刷新列表
          } else {
            message.error('Cookie删除失败');
          }
        } catch (error) {
          message.error('删除Cookie出错');
          console.error('Error deleting cookie:', error);
        } finally {
          setDeleteLoading(false);
        }
      }
    });
  };

  // 测试Cookie
  const handleTestCookie = async (cookie, id) => {
    setTestLoading(prev => ({ ...prev, [id]: true }));
    try {
      // 调用测试API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameters: {
            cookie: cookie
          },
          workflow_id: WORKFLOW_ID_TEST_COOKIE
        })
      });

      const result = await response.json();
      if (result.code === 0) {
        // 测试API调用成功后，重新获取cookie列表
        await fetchCookies();
      } else {
        message.error('Cookie测试失败');
      }
    } catch (error) {
      message.error('测试Cookie出错');
      console.error('Error testing cookie:', error);
    } finally {
      setTestLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // 组件加载时获取Cookie列表
  useEffect(() => {
    fetchCookies();
  }, []);

  // Cookie表格列定义
  const cookieColumns = [
    {
      title: 'Cookie',
      dataIndex: 'cookie',
      key: 'cookie',
      ellipsis: true,
      width: '40%',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: '25%',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '有效' : '无效'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: '20%',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            danger 
            onClick={() => handleDeleteCookie(record.cookie)}
            loading={deleteLoading}
          >
            删除
          </Button>
          <Button 
            type="link"
            onClick={() => handleTestCookie(record.cookie, record.id)}
            loading={testLoading[record.id]}
          >
            测试
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Content className="content" style={{ padding: '20px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Cookie管理区域 */}
          <Card 
            title="Cookie管理"
            extra={
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  添加Cookie
                </Button>
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                >
                  立即爬取
                </Button>
              </Space>
            }
          >
            <Table 
              columns={cookieColumns} 
              dataSource={cookies} 
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Space>

        {/* 添加Cookie的模态框 */}
        <Modal
          title="添加Cookie"
          open={isModalVisible}
          onOk={handleAddCookie}
          onCancel={() => {
            setIsModalVisible(false);
            setNewCookie('');
          }}
          confirmLoading={loading}
        >
          <TextArea
            rows={4}
            value={newCookie}
            onChange={(e) => setNewCookie(e.target.value)}
            placeholder="请输入Cookie字符串"
          />
        </Modal>
      </Content>
    </Layout>
  );
}

export default CrawlManagement; 