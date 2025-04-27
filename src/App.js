import React, { useState, useEffect } from 'react';
import { Input, Button, Card, List, message, Layout, Typography, Divider, Space, Tooltip, Modal, Select, Tag, Empty, Form } from 'antd';
import { SearchOutlined, CopyOutlined, ThunderboltOutlined, StarOutlined, HeartOutlined, InfoCircleOutlined, EditOutlined, SaveOutlined, CloseOutlined, QuestionCircleOutlined, HistoryOutlined, DeleteOutlined, RollbackOutlined, FilterOutlined, SendOutlined } from '@ant-design/icons';
import { CozeAPI } from '@coze/api';
import ReactMarkdown from 'react-markdown';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

function App() {
  const [school, setSchool] = useState('');
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [apiInfo, setApiInfo] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [style, setStyle] = useState('normal');
  const [customStyle, setCustomStyle] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [history, setHistory] = useState([]);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ school: '', style: '' });
  // 推送小程序相关状态
  const [isPushModalVisible, setIsPushModalVisible] = useState(false);
  const [currentPushContent, setCurrentPushContent] = useState(null);
  const [pushForm] = Form.useForm();
  const [pushLoading, setPushLoading] = useState(false);
  
  // 预设学校列表
  const schoolOptions = [
    '中山大学',
    '华南理工大学',
    '华南师范大学',
    '广州大学',
    '广东外语外贸大学',
    '广州中医药大学',
    '广东药科大学',
    '广东工业大学',
    '广州美术学院',
    '星海音乐学院',
    '暨南大学',
    '广州医科大学'
  ];

  // 处理学校选择变化
  const handleSchoolChange = (value) => {
    setSchool(value);
  };
  
  // 在组件加载时从本地存储加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('contentHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('解析历史记录失败:', e);
      }
    }
  }, []);

  // 保存历史记录到本地存储
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('contentHistory', JSON.stringify(history));
    }
  }, [history]);

  // 文案风格选项
  const styleOptions = [
    { value: 'normal', label: '默认风格' },
    { value: 'formal', label: '正式风格' },
    { value: 'humorous', label: '幽默风趣' },
    { value: 'emotional', label: '情感共鸣' },
    { value: 'custom_prompt', label: '自定义提示词' }
  ];

  // 处理风格选择变化
  const handleStyleChange = (value) => {
    setStyle(value);
    if (value !== 'custom_prompt') {
      setCustomStyle('');
    }
  };

  // 处理文案格式
  const formatContent = (text) => {
    // 处理文本格式
    return text
      .replace(/\n{3,}/g, '\n\n')  // 三个及以上的换行符替换
      .trim();  // 移除首尾空白
  };

  const handleGenerate = async () => {
    if (!school) {
      message.error('请输入学校名');
      return;
    }
    
    setLoading(true);
    try {
      console.log('开始调用API...');
      console.log('请求参数:', {
        parameters: {
          input: school,
          style: style === 'custom_prompt' ? customStyle : style
        },
        workflow_id: '7496428183575904307'
      });
      
      // 调用 Coze API
      const response = await fetch('https://api.coze.cn/v1/workflow/run', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pat_wBxRH66eSNFjZPp5A9WNMIJg5Ux8JJffhgjkArPPpj2DDdemVvQuVDQbIs47HaGY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameters: {
            input: school,
            style: style === 'custom_prompt' ? customStyle : style
          },
          workflow_id: '7496428183575904307'
        })
      });

      console.log('API响应状态:', response.status);
      const result = await response.json();
      console.log('API响应数据:', result);
      
      // 处理 API 响应
      if (result.code === 0 && result.data) {
        try {
          console.log('开始解析API响应数据:', result.data);
          const data = JSON.parse(result.data);
          console.log('解析后的数据:', data);
          
          if (data.report && data.tiezi) {
            // 处理报告内容
            const reportContent = data.report;
            // 处理帖子内容
            const textArray = data.tiezi
              .split(/------/)  // 使用"------"字符串分割帖子
              .map(text => text.trim())
              .filter(text => {
                // 过滤掉空文本和纯英文数字的行
                const trimmedText = text.trim();
                return trimmedText && 
                       !trimmedText.match(/^[A-Za-z0-9\s]+$/);  // 过滤掉纯英文和数字的行
              })
              .map(formatContent);
            
            console.log('处理后的文案数组:', textArray);
            if (textArray.length > 0) {
              setContents(textArray);
              
              // 更新报告内容
              const historyItem = {
                id: Date.now(),
                timestamp: new Date().toLocaleString(),
                school: school,
                style: style === 'custom_prompt' ? customStyle : style,
                contents: textArray,
                report: reportContent
              };
              
              // 添加到历史记录，限制最多保存50条记录
              setHistory(prevHistory => {
                const newHistory = [historyItem, ...prevHistory];
                return newHistory.slice(0, 50);
              });
              
              setApiInfo({
                timestamp: new Date().toLocaleString(),
                request: {
                  input: school,
                  style: style === 'custom_prompt' ? customStyle : style,
                  workflow_id: '7496428183575904307'
                },
                response: result,
                status: '成功',
                report: reportContent
              });
              
              message.success('文案生成成功');
            } else {
              console.warn('分割后的文案数组为空');
              message.warning('未生成到文案，请重试');
            }
          } else {
            console.warn('API返回数据中没有report或tiezi字段');
            message.warning('未生成到文案，请重试');
          }
        } catch (error) {
          console.error('解析API响应失败:', error);
          console.error('原始数据:', result.data);
          message.error('解析响应失败，请重试');
        }
      } else {
        console.warn('API调用失败:', result);
        message.warning('未生成到文案，请重试');
      }
    } catch (error) {
      console.error('API调用错误:', error);
      message.error('生成失败，请稍后重试');
      // 如果API调用失败，显示默认文案
      setContents([
        `🏫 ${school}的校园生活真的太美好了！每天都能感受到浓浓的学习氛围，图书馆里座无虚席，操场上充满活力，食堂的美食更是让人流连忘返～ #校园生活 #大学生活`,
        `🎓 ${school}的老师们都很专业，课堂氛围活跃，同学们互帮互助，在这里不仅能学到知识，还能收获珍贵的友谊！ #学习生活 #校园时光`,
        `🎓 ${school}的每一天都是新的开始！清晨的校园格外宁静，傍晚的夕阳映照着教学楼，一切都是那么美好🌞 #校园日常 #大学生活`
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    // 复制时去除HTML标签
    const plainText = text.replace(/<[^>]+>/g, '');
    navigator.clipboard.writeText(plainText);
    message.success('复制成功');
  };

  const handleCopyAll = () => {
    // 复制时去除HTML标签
    const allText = contents
      .map(text => text.replace(/<[^>]+>/g, ''))
      .join('\n\n');
    navigator.clipboard.writeText(allText);
    message.success('已复制所有文案！');
  };

  const showApiInfo = () => {
    setIsModalVisible(true);
  };

  // 处理编辑按钮点击
  const handleEdit = (index, content) => {
    setEditingIndex(index);
    setEditingContent(content.replace(/<[^>]+>/g, '')); // 去除HTML标签
  };

  // 处理保存编辑
  const handleSaveEdit = (index) => {
    const newContents = [...contents];
    newContents[index] = editingContent;
    setContents(newContents);
    setEditingIndex(null);
    setEditingContent('');
    message.success('文案修改成功');
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingContent('');
  };
  
  // 显示历史记录
  const showHistory = () => {
    setIsHistoryModalVisible(true);
  };

  // 恢复历史记录
  const restoreHistory = (historyItem) => {
    setSchool(historyItem.school);
    if (styleOptions.some(option => option.value === historyItem.style)) {
      setStyle(historyItem.style);
      setCustomStyle('');
    } else {
      setStyle('custom_prompt');
      setCustomStyle(historyItem.style);
    }
    setContents(historyItem.contents);
    setApiInfo(prev => ({
      ...prev,
      report: historyItem.report
    }));
    setIsHistoryModalVisible(false);
    message.success('已恢复历史记录');
  };

  // 删除历史记录
  const deleteHistory = (id) => {
    setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
    message.success('已删除该条历史记录');
  };

  // 清空历史记录
  const clearHistory = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？此操作不可恢复',
      onOk: () => {
        setHistory([]);
        localStorage.removeItem('contentHistory');
        message.success('已清空所有历史记录');
      }
    });
  };

  // 处理推送到小程序按钮点击
  const handlePush = (content) => {
    // 获取内容并分割行
    const contentLines = content.split('\n');
    // 第一行作为生成标题的参考，但不包含在正文中
    const firstLine = contentLines[0].trim();
    // 正文内容（从第二行开始）
    const bodyContent = contentLines.slice(1).join('\n').trim();
    
    // 去除表情符号和特殊字符生成标题
    const cleanTitle = firstLine.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\w\s\u4e00-\u9fa5]/g, '').trim();
    
    setCurrentPushContent(content);
    pushForm.setFieldsValue({
      title: cleanTitle || "小红书文案",
      body: bodyContent, // 使用除第一行外的内容作为正文
      images_list: [],
      school_id: 60, // 默认学校ID
      tag_id: 13, // 默认标签ID
    });
    setIsPushModalVisible(true);
  };

  // 验证API是否可用
  const validateApi = async () => {
    message.loading('正在验证API...');
    
    // 定义可能的API地址列表
    const apiUrls = [
      '/api/zc/pubs/grad_create/',
      '/api/zc/pubs/',
      'http://gxxsh.yonp.top/api/zc/pubs/grad_create/',
      'https://gxxsh.yonp.top/api/zc/pubs/grad_create/'
    ];
    
    let successful = false;
    
    for (const apiUrl of apiUrls) {
      try {
        message.info(`正在尝试连接: ${apiUrl}`);
        
        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch(apiUrl, {
          method: 'OPTIONS',
          mode: 'cors',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        clearTimeout(timeoutId); // 清除超时定时器
        
        console.log(`API ${apiUrl} 验证状态:`, response.status);
        
        if (response.ok) {
          message.success(`API可以连接: ${apiUrl}`);
          successful = true;
          
          // 记住成功的API地址
          localStorage.setItem('successfulApiUrl', apiUrl);
          
          Modal.info({
            title: 'API状态',
            content: (
              <div>
                <p>API连接成功: {apiUrl}</p>
                <p>状态码: {response.status}</p>
                <p>这表示API服务器可以访问，但不代表推送一定会成功。</p>
                <p>推送可能还需要正确的数据格式和授权信息。</p>
                <p>建议:</p>
                <ul>
                  <li>检查网络连接</li>
                  <li>联系API提供者确认正确的地址</li>
                  <li>尝试使用代理服务器转发请求</li>
                  <li>
                    在package.json中添加代理配置：
                    <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                      "proxy": "http://gxxsh.yonp.top"
                    </pre>
                  </li>
                </ul>
              </div>
            )
          });
          break;
        }
      } catch (error) {
        console.error(`API ${apiUrl} 验证错误:`, error);
      }
    }
    
    if (!successful) {
      message.error(`所有API地址连接失败`);
      Modal.error({
        title: 'API不可用',
        content: (
          <div>
            <p>错误: Failed to fetch - 无法连接到任何API地址</p>
            <p>可能的原因:</p>
            <ul>
              <li>API服务器可能暂时不可用</li>
              <li>API地址可能已更改</li>
              <li>网络连接问题</li>
              <li>浏览器的跨域(CORS)限制</li>
              <li>防火墙或安全软件阻止了连接</li>
            </ul>
            <p>建议:</p>
            <ul>
              <li>检查网络连接</li>
              <li>联系API提供者确认正确的地址</li>
              <li>尝试使用代理服务器转发请求</li>
            </ul>
          </div>
        )
      });
    }
  };

  // 处理推送提交
  const handlePushSubmit = async () => {
    try {
      setPushLoading(true);
      const values = await pushForm.validateFields();
      
      // 构建符合API要求的数据结构
      const requestData = {
        title: values.title,
        body: values.body,
        images_list: Array.isArray(values.images_list) ? values.images_list : [],
        school_id: parseInt(values.school_id),
        tag_id: parseInt(values.tag_id)
      };
      
      console.log('推送数据:', JSON.stringify(requestData));
      
      // 获取验证成功的API地址或使用默认地址
      const apiUrl = localStorage.getItem('successfulApiUrl') || '/api/zc/pubs/grad_create/';
      console.log('使用API地址:', apiUrl);
      
      // 设置请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      try {
        // 发送推送请求
        const response = await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors', // 启用跨域请求
          signal: controller.signal, // 添加超时控制
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // 注意：这里的token需要替换为实际的授权token
            // 'Authorization': 'Bearer yourtoken' // 如需token认证，请取消此行注释并更新token
          },
          body: JSON.stringify(requestData)
        });
        
        clearTimeout(timeoutId); // 清除超时定时器
        
        console.log('推送响应状态:', response.status);
        const responseText = await response.text();
        console.log('推送响应内容:', responseText);
        
        if (response.ok) {
          message.success('推送成功');
          setIsPushModalVisible(false);
          
          // 显示更多提示信息
          Modal.info({
            title: '推送信息',
            content: (
              <div>
                <p>推送已成功提交到小程序。</p>
                <p>注意：如果推送后无法在小程序中看到内容，可能有以下原因：</p>
                <ul>
                  <li>API服务器端处理延迟</li>
                  <li>数据需要审核</li>
                  <li>校区ID或标签ID不正确</li>
                  <li>可能需要登录授权 (Authorization头)</li>
                </ul>
                <p>请根据控制台日志中的响应信息进行排查。</p>
              </div>
            ),
          });
        } else {
          let errorMessage = '未知错误';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
          } catch (e) {
            errorMessage = responseText || `服务器错误 (${response.status})`;
          }
          message.error(`推送失败: ${errorMessage}`);
          
          // 显示详细错误信息
          Modal.error({
            title: '推送失败',
            content: (
              <div>
                <p>错误信息: {errorMessage}</p>
                <p>状态码: {response.status}</p>
                <p>可能的原因:</p>
                <ul>
                  <li>API地址不正确</li>
                  <li>数据格式不符合要求</li>
                  <li>服务器拒绝请求 (可能需要授权)</li>
                  <li>网络连接问题</li>
                </ul>
                <p>请检查浏览器控制台获取更多信息。</p>
              </div>
            ),
          });
        }
      } catch (fetchError) {
        clearTimeout(timeoutId); // 清除超时定时器
        
        if (fetchError.name === 'AbortError') {
          message.error('请求超时，API服务器没有响应');
          Modal.error({
            title: '请求超时',
            content: (
              <div>
                <p>API服务器在规定时间内没有响应 (10秒)</p>
                <p>可能的原因:</p>
                <ul>
                  <li>API服务器响应缓慢或不可用</li>
                  <li>网络连接问题</li>
                  <li>API地址不正确</li>
                </ul>
                <p>建议:</p>
                <ul>
                  <li>稍后再试</li>
                  <li>检查API地址是否正确</li>
                  <li>检查网络连接</li>
                </ul>
              </div>
            )
          });
        } else if (fetchError.message && fetchError.message.includes('Failed to fetch')) {
          // 处理Failed to fetch错误
          Modal.error({
            title: 'API连接失败',
            content: (
              <div>
                <p>错误: Failed to fetch - 无法连接到API服务器</p>
                <p>可能的原因及解决方案:</p>
                <ol>
                  <li><strong>跨域(CORS)问题</strong>: 使用以下解决方案之一:
                    <ul>
                      <li>尝试使用相对路径: <code>/api/zc/pubs/grad_create/</code></li>
                      <li>确保<code>src/setupProxy.js</code>文件配置正确</li>
                      <li>使用浏览器扩展临时禁用CORS (仅开发环境)</li>
                    </ul>
                  </li>
                  <li><strong>网络连接问题</strong>: 检查您的互联网连接</li>
                  <li><strong>API服务器不可用</strong>: 联系API提供方确认服务状态</li>
                  <li><strong>安全软件拦截</strong>: 检查防火墙或安全软件设置</li>
                </ol>
                <p>推荐操作:</p>
                <p>重新启动应用，并确保使用开发服务器(<code>npm start</code>)而不是生产构建</p>
              </div>
            )
          });
        } else if (fetchError.message && fetchError.message.includes('NetworkError') || 
                  (fetchError.message && fetchError.message.includes('CORS'))) {
          // 处理CORS错误
          Modal.error({
            title: '跨域(CORS)错误',
            content: (
              <div>
                <p>浏览器阻止了跨域请求</p>
                <p>解决方案:</p>
                <ol>
                  <li><strong>使用代理</strong>:
                    <ul>
                      <li>确保<code>setupProxy.js</code>文件已正确配置</li>
                      <li>重启开发服务器 (<code>npm start</code>)</li>
                    </ul>
                  </li>
                  <li><strong>临时解决方案</strong>:
                    <ul>
                      <li>安装CORS浏览器扩展并启用</li>
                      <li>或使用命令行启动Chrome并禁用同源策略 (不推荐用于生产环境)</li>
                    </ul>
                  </li>
                  <li><strong>API端解决</strong>:
                    <ul>
                      <li>API服务器需要添加正确的CORS头</li>
                      <li>联系API提供方添加CORS支持</li>
                    </ul>
                  </li>
                </ol>
              </div>
            )
          });
        } else {
          // 处理其他错误
          message.error(`推送失败: ${fetchError.message || '请检查输入后重试'}`);
        }
      }
    } catch (error) {
      console.error('表单验证错误:', error);
      message.error('表单验证失败，请检查输入');
    } finally {
      setPushLoading(false);
    }
  };

  // 获取过滤后的历史记录
  const getFilteredHistory = () => {
    return history.filter(item => {
      const schoolMatch = !historyFilter.school || item.school.includes(historyFilter.school);
      const styleMatch = !historyFilter.style || item.style.includes(historyFilter.style);
      return schoolMatch && styleMatch;
    });
  };

  return (
    <Layout className="layout">
      <Header className="header">
        <div className="header-content">
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            小红书文案生成器
          </Title>
          <div className="header-icons">
            <Tooltip title="历史记录">
              <HistoryOutlined 
                className="header-icon" 
                onClick={showHistory}
                style={{ cursor: 'pointer' }}
              />
            </Tooltip>
            <Tooltip title="查看API调用信息">
              <InfoCircleOutlined 
                className="header-icon" 
                onClick={showApiInfo}
                style={{ cursor: 'pointer' }}
              />
            </Tooltip>
            <Tooltip title="快速生成">
              <ThunderboltOutlined className="header-icon" />
            </Tooltip>
            <Tooltip title="收藏">
              <StarOutlined className="header-icon" />
            </Tooltip>
            <Tooltip title="喜欢">
              <HeartOutlined className="header-icon" />
            </Tooltip>
          </div>
        </div>
      </Header>
      <Content className="content">
        <div className="main-container">
          <div className="input-section">
            <Space>
              <Select
                showSearch
                size="large"
                placeholder="请选择或输入学校名"
                value={school}
                onChange={handleSchoolChange}
                style={{ width: '300px' }}
                className="glow-input"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                allowClear
              >
                {schoolOptions.map(school => (
                  <Option key={school} value={school}>{school}</Option>
                ))}
              </Select>
              <Tooltip 
                title={
                  <div style={{ color: '#333', fontSize: '14px', lineHeight: '1.5' }}>
                    仅支持下拉框中列出的学校，选择其他学校生成的文案可能与具体学校特色无关
                  </div>
                }
                placement="top"
                overlayStyle={{ maxWidth: '300px' }}
                color="#fff"
              >
                <QuestionCircleOutlined style={{ fontSize: '16px', color: '#666', cursor: 'pointer' }} />
              </Tooltip>
            </Space>
            <Select
              size="large"
              value={style}
              onChange={handleStyleChange}
              style={{ width: '120px', marginLeft: '16px', marginRight: '16px' }}
              className="style-select"
            >
              {styleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
            {(style === 'custom_prompt') && (
              <Input
                size="large"
                placeholder="请输入提示词（如风格、主题、长短等）"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                style={{ width: '250px', marginRight: '16px' }}
                className="glow-input"
              />
            )}
            <Button
              type="primary"
              size="large"
              onClick={handleGenerate}
              loading={loading}
              className="glow-button"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              生成文案
            </Button>
          </div>
          
          <div className="content-display">
            <div className="left-section">
              <Card className="content-card">
                <div className="content-header">
                  <Title level={4} style={{ margin: 0 }}>生成结果</Title>
                  {contents.length > 0 && (
                    <Button
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={handleCopyAll}
                      className="copy-all-button"
                    >
                      复制全部
                    </Button>
                  )}
                </div>
                <Divider />
                {contents.length > 0 ? (
                  <div className="content-text-container">
                    {contents.map((item, index) => (
                      <div key={index} className="content-text-item">
                        <div className="content-text-header">
                          <Text strong>文案 {index + 1}</Text>
                          <Space>
                            {editingIndex === index ? (
                              <>
                                <Button
                                  type="primary"
                                  icon={<SaveOutlined />}
                                  onClick={() => handleSaveEdit(index)}
                                  className="action-button"
                                >
                                  保存
                                </Button>
                                <Button
                                  type="text"
                                  icon={<CloseOutlined />}
                                  onClick={handleCancelEdit}
                                  className="action-button"
                                >
                                  取消
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  type="text"
                                  icon={<EditOutlined />}
                                  onClick={() => handleEdit(index, item)}
                                  className="action-button"
                                >
                                  编辑
                                </Button>
                                <Button
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => handleCopy(item)}
                                  className="action-button"
                                >
                                  复制
                                </Button>
                                <Button
                                  type="primary"
                                  icon={<SendOutlined />}
                                  onClick={() => handlePush(item)}
                                  className="action-button"
                                >
                                  推送到小程序
                                </Button>
                              </>
                            )}
                          </Space>
                        </div>
                        {editingIndex === index ? (
                          <Input.TextArea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            autoSize={{ minRows: 3, maxRows: 6 }}
                            className="edit-textarea"
                          />
                        ) : (
                          <div 
                            className="content-text"
                            style={{ whiteSpace: 'pre-wrap' }}
                          >
                            {item}
                          </div>
                        )}
                        {index < contents.length - 1 && <Divider />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-content">
                    <Text type="secondary">请输入学校名称并点击生成按钮</Text>
                  </div>
                )}
              </Card>
            </div>
            
            <div className="right-section">
              <Card className="right-card">
                <div className="content-header">
                  <Title level={4} style={{ margin: 0 }}>报告展示</Title>
                </div>
                <Divider />
                <div className="right-content">
                  {apiInfo && apiInfo.report ? (
                    <div className="report-content">
                      <ReactMarkdown>{apiInfo.report}</ReactMarkdown>
                    </div>
                  ) : (
                    <Text type="secondary">这里将展示报告内容</Text>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Content>

      <Modal
        title="API调用信息"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {apiInfo ? (
          <div className="api-info">
            <p><strong>调用时间:</strong>{apiInfo.timestamp}</p>
            <p><strong>状态：</strong>{apiInfo.status}</p>
            <p><strong>请求参数:</strong></p>
            <pre>{JSON.stringify(apiInfo.request, null, 2)}</pre>
            <p><strong>响应数据:</strong></p>
            <pre>{JSON.stringify(apiInfo.response, null, 2)}</pre>
          </div>
        ) : (
          <Text type="secondary">暂无API调用信息</Text>
        )}
      </Modal>
      
      {/* 历史记录模态框 */}
      <Modal
        title="历史记录"
        open={isHistoryModalVisible}
        onCancel={() => setIsHistoryModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select
              showSearch
              placeholder="按学校名称筛选"
              value={historyFilter.school}
              onChange={(value) => setHistoryFilter(prev => ({ ...prev, school: value }))}
              style={{ width: 200 }}
              allowClear
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {schoolOptions.map(school => (
                <Option key={school} value={school}>{school}</Option>
              ))}
            </Select>
            <Select
              placeholder="按风格筛选"
              value={historyFilter.style}
              onChange={(value) => setHistoryFilter(prev => ({ ...prev, style: value }))}
              style={{ width: 150 }}
              allowClear
            >
              {styleOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              清空记录
            </Button>
          </Space>
        </div>
        
        {getFilteredHistory().length > 0 ? (
          <List
            dataSource={getFilteredHistory()}
            renderItem={item => (
              <List.Item
                key={item.id}
                actions={[
                  <Button 
                    type="primary" 
                    icon={<RollbackOutlined />} 
                    onClick={() => restoreHistory(item)}
                  >
                    恢复
                  </Button>,
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => deleteHistory(item.id)}
                  />
                ]}
              >
                <List.Item.Meta
                  title={<span>{item.school} - {item.timestamp}</span>}
                  description={`${item.contents.length}篇文案，风格${item.style}`}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无历史记录" />
        )}
      </Modal>
      
      {/* 推送到小程序弹窗 */}
      <Modal
        title="推送到小程序"
        open={isPushModalVisible}
        onCancel={() => setIsPushModalVisible(false)}
        footer={[
          <Button key="verify" onClick={validateApi} style={{ float: 'left' }}>
            验证API
          </Button>,
          <Tooltip key="useRelativePath" title="尝试使用相对路径解决CORS问题">
            <Button 
              style={{ float: 'left', marginLeft: '8px' }}
              onClick={() => {
                localStorage.setItem('successfulApiUrl', '/api/zc/pubs/grad_create/');
                message.info('已切换到相对路径');
              }}
            >
              使用相对路径
            </Button>
          </Tooltip>,
          <Button key="cancel" onClick={() => setIsPushModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={pushLoading} onClick={handlePushSubmit}>
            确认推送
          </Button>
        ]}
        width={600}
      >
        <Form
          form={pushForm}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="body"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Input.TextArea rows={6} />
          </Form.Item>
          <Form.Item
            name="images_list"
            label="图片列表 (可选)"
          >
            <Select mode="tags" placeholder="输入图片URL后按回车键添加">
            </Select>
          </Form.Item>
          <Form.Item
            name="school_id"
            label="学校ID"
            rules={[{ required: true, message: '请输入学校ID' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="tag_id"
            label="标签ID"
            rules={[{ required: true, message: '请输入标签ID' }]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default App; 