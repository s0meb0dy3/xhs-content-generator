import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input, Table, Space, Typography, message, Tag, Modal, Select, Progress, Spin, Row, Col, Divider, TimePicker, Form, Switch, Tooltip } from 'antd';
import { PlayCircleOutlined, PlusOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined, SaveOutlined, FileOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import defaultTasksConfig from '../tasks-config.json';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const API_URL = 'https://api.coze.cn/v1/workflow/run';
const AUTH_TOKEN = 'pat_wBxRH66eSNFjZPp5A9WNMIJg5Ux8JJffhgjkArPPpj2DDdemVvQuVDQbIs47HaGY';
const WORKFLOW_ID_ADD_COOKIE = '7502647053794164799';
const WORKFLOW_ID_GET_COOKIES = '7502648298550198291';
const WORKFLOW_ID_DELETE_COOKIE = '7502655538469503027';
const WORKFLOW_ID_TEST_COOKIE = '7502646950479708169';
const WORKFLOW_ID_GET_SCHOOLS = '7502357002224910348';
const WORKFLOW_ID_CRAWL = '7498927416393728034';

function CrawlManagement() {
  const [cookies, setCookies] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newCookie, setNewCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [testLoading, setTestLoading] = useState({});
  
  // 爬虫相关状态
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlResults, setCrawlResults] = useState([]);
  const [activeCookie, setActiveCookie] = useState(null);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawlStatus, setCrawlStatus] = useState('idle'); // idle, crawling, completed, failed

  // 定时任务相关状态
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();
  const [taskIntervalId, setTaskIntervalId] = useState(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configContent, setConfigContent] = useState("");
  const [configChanged, setConfigChanged] = useState(false);

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
        
        // 找出一个有效的cookie
        const activeCookie = cookieList.find(item => item.status === 'active');
        if (activeCookie) {
          setActiveCookie(activeCookie.cookie);
        }
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

  // 获取学校列表
  const fetchSchools = async () => {
    setSchoolsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameters: {},
          workflow_id: WORKFLOW_ID_GET_SCHOOLS
        })
      });

      const result = await response.json();
      if (result.code === 0) {
        const data = JSON.parse(result.data);
        setSchools(data.output);
      } else {
        message.error('获取学校列表失败');
      }
    } catch (error) {
      message.error('获取学校列表出错');
      console.error('Error fetching schools:', error);
    } finally {
      setSchoolsLoading(false);
    }
  };

  // 爬取特定学校
  const crawlSchool = async (school, cookie) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameters: {
            college_name: school.school,
            cookie: cookie
          },
          workflow_id: WORKFLOW_ID_CRAWL
        })
      });

      const result = await response.json();
      if (result.code === 0) {
        const data = JSON.parse(result.data);
        const allSuccess = data.code_list && data.code_list.every(code => code === 0);
        return {
          school: school.school,
          schoolId: school.school_id,
          success: allSuccess,
          result: data.code_list
        };
      } else {
        return {
          school: school.school,
          schoolId: school.school_id,
          success: false,
          error: '爬取失败'
        };
      }
    } catch (error) {
      console.error('Error crawling school:', error);
      return {
        school: school.school,
        schoolId: school.school_id,
        success: false,
        error: error.message
      };
    }
  };

  // 开始爬取
  const startCrawl = async (targetSchoolId = null) => {
    if (!activeCookie) {
      message.warning('没有可用的Cookie');
      return;
    }

    const schoolIdToUse = targetSchoolId || selectedSchool;

    if (schoolIdToUse) {
      // 爬取单个学校
      setCrawlLoading(true);
      setCrawlStatus('crawling');
      setCrawlProgress(0);
      
      try {
        const school = schools.find(s => s.school_id === schoolIdToUse);
        if (!school) {
          message.error('未找到选定的学校');
          return;
        }
        
        setCrawlProgress(50);
        const result = await crawlSchool(school, activeCookie);
        setCrawlResults([result]);
        setCrawlProgress(100);
        setCrawlStatus(result.success ? 'completed' : 'failed');
        message.success(`${school.school}爬取${result.success ? '成功' : '失败'}`);
        return result.success;
      } catch (error) {
        message.error('爬取过程出错');
        setCrawlStatus('failed');
        return false;
      } finally {
        setCrawlLoading(false);
      }
    } else {
      // 爬取所有学校
      setCrawlLoading(true);
      setCrawlStatus('crawling');
      setCrawlResults([]);

      try {
        const results = [];
        for (let i = 0; i < schools.length; i++) {
          const school = schools[i];
          setCrawlProgress(Math.floor((i / schools.length) * 100));
          
          // 更新当前爬取的学校
          message.info(`正在爬取：${school.school}`);
          
          const result = await crawlSchool(school, activeCookie);
          results.push(result);
          setCrawlResults([...results]);
          
          // 如果cookie失效，尝试获取新的cookie
          if (!result.success) {
            await fetchCookies();
            if (!activeCookie) {
              message.warning('没有可用的Cookie，爬取中断');
              break;
            }
          }
        }
        
        setCrawlProgress(100);
        setCrawlStatus('completed');
        message.success('爬取完成');
        return results.every(r => r.success);
      } catch (error) {
        message.error('爬取过程出错');
        setCrawlStatus('failed');
        return false;
      } finally {
        setCrawlLoading(false);
      }
    }
  };

  // 加载定时任务配置
  const loadTasksConfig = () => {
    try {
      // 使用默认配置
      setScheduledTasks(defaultTasksConfig);
      setConfigContent(JSON.stringify(defaultTasksConfig, null, 2));
      message.success('定时任务配置加载成功');
    } catch (error) {
      console.error('Error loading tasks config:', error);
      message.error('加载定时任务配置出错');
    }
  };

  // 编辑配置文件内容
  const openConfigEditor = () => {
    setConfigContent(JSON.stringify(scheduledTasks, null, 2));
    setConfigModalVisible(true);
    setConfigChanged(false);
  };

  // 保存配置文件内容
  const saveConfigChanges = () => {
    try {
      const newTasks = JSON.parse(configContent);
      if (Array.isArray(newTasks)) {
        setScheduledTasks(newTasks);
        setConfigModalVisible(false);
        message.success('定时任务配置已保存');
      } else {
        throw new Error('配置内容不是有效的任务数组');
      }
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  };

  // 添加定时任务
  const handleAddSchedule = (values) => {
    const { name, time, schoolId, enabled } = values;
    
    const newTask = {
      id: Date.now(),
      name,
      time: time.format('HH:mm'),
      schoolId: schoolId,
      schoolName: schoolId ? schools.find(s => s.school_id === schoolId)?.school : '全部学校',
      enabled,
      lastRun: null,
      lastStatus: null
    };
    
    if (editingTask) {
      // 更新现有任务
      const updatedTasks = scheduledTasks.map(task => 
        task.id === editingTask.id ? { ...newTask, id: task.id } : task
      );
      setScheduledTasks(updatedTasks);
      message.success('定时任务已更新');
    } else {
      // 添加新任务
      const updatedTasks = [...scheduledTasks, newTask];
      setScheduledTasks(updatedTasks);
      message.success('定时任务已添加');
    }
    
    setIsScheduleModalVisible(false);
    setEditingTask(null);
    form.resetFields();
  };

  // 删除定时任务
  const handleDeleteSchedule = (taskId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个定时任务吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        const updatedTasks = scheduledTasks.filter(task => task.id !== taskId);
        setScheduledTasks(updatedTasks);
        message.success('定时任务已删除');
      }
    });
  };

  // 编辑定时任务
  const handleEditSchedule = (task) => {
    setEditingTask(task);
    form.setFieldsValue({
      name: task.name,
      time: dayjs(task.time, 'HH:mm'),
      schoolId: task.schoolId,
      enabled: task.enabled
    });
    setIsScheduleModalVisible(true);
  };

  // 切换任务启用状态
  const toggleTaskEnabled = (taskId, enabled) => {
    const updatedTasks = scheduledTasks.map(task => 
      task.id === taskId ? { ...task, enabled } : task
    );
    setScheduledTasks(updatedTasks);
  };

  // 检查是否有任务需要执行
  const checkScheduledTasks = async () => {
    const now = dayjs();
    const currentTime = now.format('HH:mm');
    
    for (const task of scheduledTasks) {
      if (task.enabled && task.time === currentTime) {
        // 判断是否今天已经执行过
        const lastRunDate = task.lastRun ? dayjs(task.lastRun).format('YYYY-MM-DD') : null;
        const today = now.format('YYYY-MM-DD');
        
        if (lastRunDate !== today) {
          message.info(`开始执行定时任务: ${task.name}`);
          
          // 执行爬取任务
          const success = await startCrawl(task.schoolId);
          
          // 更新任务状态
          const updatedTasks = scheduledTasks.map(t => 
            t.id === task.id ? { 
              ...t, 
              lastRun: now.format('YYYY-MM-DD HH:mm:ss'),
              lastStatus: success ? 'success' : 'failed'
            } : t
          );
          
          setScheduledTasks(updatedTasks);
          
          message.success(`定时任务 ${task.name} 执行${success ? '成功' : '失败'}`);
        }
      }
    }
  };

  // 组件加载时获取Cookie列表和学校列表
  useEffect(() => {
    fetchCookies();
    fetchSchools();
    loadTasksConfig();
    
    // 设置定时检查任务
    const intervalId = setInterval(() => {
      checkScheduledTasks();
    }, 60000); // 每分钟检查一次
    
    setTaskIntervalId(intervalId);
    
    // 组件卸载时清除定时器
    return () => {
      if (taskIntervalId) {
        clearInterval(taskIntervalId);
      }
    };
  }, []);

  // 当scheduledTasks更新时，需要更新检查逻辑
  useEffect(() => {
    // 清除旧的定时器
    if (taskIntervalId) {
      clearInterval(taskIntervalId);
    }
    
    // 设置新的定时器
    const intervalId = setInterval(() => {
      checkScheduledTasks();
    }, 60000);
    
    setTaskIntervalId(intervalId);
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [scheduledTasks]);

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

  // 爬取结果表格列定义
  const crawlResultColumns = [
    {
      title: '学校',
      dataIndex: 'school',
      key: 'school',
      width: '40%',
    },
    {
      title: '学校ID',
      dataIndex: 'schoolId',
      key: 'schoolId',
      width: '20%',
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'status',
      width: '40%',
      render: (success) => (
        <Tag color={success ? 'green' : 'red'} icon={success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {success ? '爬取成功' : '爬取失败'}
        </Tag>
      ),
    },
  ];

  // 定时任务表格列定义
  const scheduleColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
    },
    {
      title: '执行时间',
      dataIndex: 'time',
      key: 'time',
      width: '15%',
      render: (time) => (
        <Space>
          <ClockCircleOutlined />
          <span>{time}</span>
        </Space>
      )
    },
    {
      title: '爬取范围',
      dataIndex: 'schoolName',
      key: 'schoolName',
      width: '20%',
    },
    {
      title: '上次执行',
      dataIndex: 'lastRun',
      key: 'lastRun',
      width: '20%',
      render: (lastRun) => lastRun || '从未执行'
    },
    {
      title: '状态',
      key: 'status',
      width: '10%',
      render: (_, record) => (
        <Space>
          <Switch 
            checked={record.enabled} 
            onChange={(checked) => toggleTaskEnabled(record.id, checked)}
            size="small"
          />
          {record.lastStatus && (
            <Tag color={record.lastStatus === 'success' ? 'green' : 'red'}>
              {record.lastStatus === 'success' ? '成功' : '失败'}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: '15%',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="编辑">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => handleEditSchedule(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button 
              type="link" 
              danger
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteSchedule(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Content className="content" style={{ padding: '16px' }}>
        <Row gutter={16}>
          {/* 左侧：Cookie管理区域 */}
          <Col span={10}>
            <Card 
              title="Cookie管理"
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  添加Cookie
                </Button>
              }
              style={{ height: 'calc(100vh - 32px)', overflowY: 'auto' }}
            >
              <Table 
                columns={cookieColumns} 
                dataSource={cookies} 
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          
          {/* 右侧：爬虫控制区域 */}
          <Col span={14}>
            <Space direction="vertical" style={{ width: '100%', height: 'calc(100vh - 32px)', overflowY: 'auto' }}>
              {/* 爬虫控制卡片 */}
              <Card 
                title="爬虫控制"
                extra={
                  <Space>
                    <Button 
                      icon={<SyncOutlined />} 
                      onClick={fetchSchools}
                      loading={schoolsLoading}
                    >
                      刷新学校列表
                    </Button>
                    <Button 
                      type="primary" 
                      icon={<PlayCircleOutlined />}
                      onClick={() => startCrawl()}
                      loading={crawlLoading}
                      disabled={!activeCookie}
                    >
                      开始爬取
                    </Button>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={16} align="middle">
                    <Col span={6}>
                      <Text strong>选择学校：</Text>
                    </Col>
                    <Col span={18}>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="选择要爬取的学校（不选则爬取全部）"
                        allowClear
                        loading={schoolsLoading}
                        onChange={setSelectedSchool}
                        value={selectedSchool}
                      >
                        {schools.map(school => (
                          <Option key={school.school_id} value={school.school_id}>
                            {school.school}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                  </Row>

                  <Divider />

                  <Row>
                    <Col span={24}>
                      <Text strong>当前爬取状态：</Text>
                      {crawlStatus === 'idle' && <Text>空闲</Text>}
                      {crawlStatus === 'crawling' && (
                        <Space>
                          <Spin />
                          <Text type="warning">爬取中...</Text>
                        </Space>
                      )}
                      {crawlStatus === 'completed' && <Text type="success">爬取完成</Text>}
                      {crawlStatus === 'failed' && <Text type="danger">爬取失败</Text>}
                    </Col>
                  </Row>

                  {crawlStatus !== 'idle' && (
                    <>
                      <Row style={{ marginTop: 16 }}>
                        <Col span={24}>
                          <Progress percent={crawlProgress} status={crawlStatus === 'failed' ? 'exception' : undefined} />
                        </Col>
                      </Row>

                      <Divider />

                      <Row>
                        <Col span={24}>
                          <Text strong style={{ marginBottom: 8, display: 'block' }}>爬取结果：</Text>
                          <Table 
                            columns={crawlResultColumns} 
                            dataSource={crawlResults} 
                            rowKey="schoolId"
                            pagination={false}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                </Space>
              </Card>

              {/* 定时任务卡片 */}
              <Card
                title="定时任务"
                extra={
                  <Space>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingTask(null);
                        form.resetFields();
                        setIsScheduleModalVisible(true);
                      }}
                    >
                      添加定时任务
                    </Button>
                    <Button
                      icon={<FileOutlined />}
                      onClick={openConfigEditor}
                    >
                      编辑配置文件
                    </Button>
                  </Space>
                }
              >
                <Table
                  columns={scheduleColumns}
                  dataSource={scheduledTasks}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Space>
          </Col>
        </Row>

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

        {/* 添加/编辑定时任务的模态框 */}
        <Modal
          title={editingTask ? "编辑定时任务" : "添加定时任务"}
          open={isScheduleModalVisible}
          onOk={() => form.submit()}
          onCancel={() => {
            setIsScheduleModalVisible(false);
            setEditingTask(null);
            form.resetFields();
          }}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddSchedule}
            initialValues={{
              enabled: true,
              time: dayjs('08:00', 'HH:mm')
            }}
          >
            <Form.Item
              name="name"
              label="任务名称"
              rules={[{ required: true, message: '请输入任务名称' }]}
            >
              <Input placeholder="请输入任务名称" />
            </Form.Item>
            
            <Form.Item
              name="time"
              label="执行时间"
              rules={[{ required: true, message: '请选择执行时间' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="schoolId"
              label="爬取学校"
              extra="不选择则爬取全部学校"
            >
              <Select
                placeholder="选择要爬取的学校"
                allowClear
                style={{ width: '100%' }}
              >
                {schools.map(school => (
                  <Option key={school.school_id} value={school.school_id}>
                    {school.school}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="enabled"
              label="启用任务"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>

        {/* 配置文件编辑模态框 */}
        <Modal
          title="编辑定时任务配置文件"
          open={configModalVisible}
          onOk={saveConfigChanges}
          onCancel={() => setConfigModalVisible(false)}
          width={800}
          okButtonProps={{ disabled: !configChanged }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text>编辑定时任务配置，所有用户将共享相同的配置：</Text>
          </div>
          <TextArea
            rows={20}
            value={configContent}
            onChange={(e) => {
              setConfigContent(e.target.value);
              setConfigChanged(true);
            }}
            style={{ fontFamily: 'monospace' }}
          />
        </Modal>
      </Content>
    </Layout>
  );
}

export default CrawlManagement; 