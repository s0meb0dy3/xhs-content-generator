import React, { useState, useEffect } from 'react';
import { Input, Button, Card, List, message, Layout, Typography, Divider, Space, Tooltip, Modal, Select, Tag, Empty, Form } from 'antd';
import { SearchOutlined, CopyOutlined, ThunderboltOutlined, StarOutlined, HeartOutlined, InfoCircleOutlined, EditOutlined, SaveOutlined, CloseOutlined, QuestionCircleOutlined, HistoryOutlined, DeleteOutlined, RollbackOutlined, FilterOutlined, SendOutlined, RobotOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons';
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
  const [crawlLoading, setCrawlLoading] = useState(false);
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
  const [reportTitle, setReportTitle] = useState('autoGML报告展示');
  // 推送小程序相关状态
  const [isPushModalVisible, setIsPushModalVisible] = useState(false);
  const [currentPushContent, setCurrentPushContent] = useState(null);
  const [pushForm] = Form.useForm();
  const [pushLoading, setPushLoading] = useState(false);
  // AI修改相关状态
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiModifyModalVisible, setIsAiModifyModalVisible] = useState(false);
  const [aiModifyOriginalContent, setAiModifyOriginalContent] = useState('');
  const [aiModifyResult, setAiModifyResult] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [editingAiModifyOriginal, setEditingAiModifyOriginal] = useState('');
  // 添加爬取文案排序状态
  const [crawlSortType, setCrawlSortType] = useState('default'); // 默认、热度（点赞数）、时间
  const [crawlResults, setCrawlResults] = useState([]); // 存储爬取的原始数据，用于排序
  
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
      message.error('请先选择或输入学校名称');
      return;
    }
    
    setReportTitle('autoGML报告展示');
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

  // 爬虫模式处理函数
  const handleCrawl = async () => {
    if (!school) {
      message.error('请先选择或输入学校名称');
      return;
    }
    
    setReportTitle('爬取文案展示');
    setCrawlLoading(true);
    try {
      message.info('开始爬取' + school + '的相关数据...');
      
      // 调用爬虫API
      const response = await fetch('https://api.coze.cn/v1/workflow/run', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pat_wBxRH66eSNFjZPp5A9WNMIJg5Ux8JJffhgjkArPPpj2DDdemVvQuVDQbIs47HaGY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameters: {
            college_name: school
          },
          workflow_id: '7496379054380482599'
        })
      });

      console.log('爬虫API响应状态:', response.status);
      const result = await response.json();
      console.log('爬虫API响应数据:', result);
      
      // 处理API响应
      if (result.code === 0 && result.data) {
        try {
          console.log('开始解析爬虫API响应数据:', result.data);
          let data;
          if (typeof result.data === 'string') {
            data = JSON.parse(result.data);
          } else {
            data = result.data;
          }
          
          if (data.outputList && data.outputList.length > 0) {
            // 存储原始数据用于排序
            setCrawlResults(data.outputList);
            // 重置排序类型
            setCrawlSortType('default');
            
            // 准备爬取内容，但不立即添加到contents
            const formattedResults = data.outputList.map(item => {
              // 使用API返回的title字段
              const title = item.title || '无标题';
              const content = item.content;
              // 添加原文链接
              const noteUrl = item.note_url ? `\n\n原文链接: ${item.note_url}` : '';
              // 添加上传时间，仅保留年月日
              let uploadTime = '';
              if (item.upload_time) {
                // 尝试提取日期部分（年月日）
                const dateMatch = item.upload_time.match(/\d{4}-\d{2}-\d{2}/);
                if (dateMatch) {
                  uploadTime = `\n\n发布时间: ${dateMatch[0]}`;
                } else {
                  // 如果格式不匹配，则保留原样
                  uploadTime = `\n\n发布时间: ${item.upload_time}`;
                }
              }
              
              return `🏫 ${school}小红书文案 - ${title}\n\n${content}${noteUrl}${uploadTime}`;
            });
            
            // 记录爬取结果，但不设置到contents
            window.crawledContents = formattedResults;
            
            // 生成爬取文案的HTML展示
            const reportHTML = generateCrawlResultsHTML(data.outputList, school);
            
            // 设置报告内容为HTML格式
            setApiInfo({
              timestamp: new Date().toLocaleString(),
              request: {
                college_name: school,
                workflow_id: '7496379054380482599'
              },
              response: result,
              status: '成功',
              report: reportHTML
            });
            
            // 添加到历史记录
            const historyItem = {
              id: Date.now(),
              timestamp: new Date().toLocaleString(),
              school: school,
              style: '爬虫模式',
              contents: formattedResults,
              report: reportHTML,
              originalData: data.outputList // 保存原始数据以便后续排序
            };
            
            setHistory(prevHistory => {
              const newHistory = [historyItem, ...prevHistory];
              return newHistory.slice(0, 50); // 限制最多保存50条记录
            });
            
            message.success('爬虫数据获取成功');
            
            // 添加复制到生成结果区的全局函数
            window.copyToResults = (index) => {
              // 如果存在排序后的索引映射，使用它来获取正确的索引
              const originalIndex = window.sortedIndexMap ? window.sortedIndexMap[index] : index;
              
              // 如果爬取结果存在
              if (window.crawledContents && window.crawledContents[originalIndex]) {
                // 获取原始文案内容
                let content = window.crawledContents[originalIndex];
                
                // 处理文案格式
                try {
                  // 1. 去掉前缀 "🏫 XX大学小红书文案 - "
                  content = content.replace(/^🏫[\s\S]*?小红书文案[\s\S]*?-\s*/g, '');
                  
                  // 2. 去掉原文链接和发布时间
                  content = content.replace(/\n\n原文链接:[\s\S]*?(?=\n\n|$)/g, '');
                  content = content.replace(/\n\n发布时间:[\s\S]*?(?=\n\n|$)/g, '');
                  
                  // 3. 清理可能残留的多余换行
                  content = content.replace(/\n{3,}/g, '\n\n');
                  content = content.trim();
                } catch (e) {
                  console.error('处理文案格式时出错:', e);
                }
                
                // 添加处理后的内容到生成区
                setContents(prev => [content, ...prev]);
                message.success('已添加到生成结果区');
              } else {
                message.error('找不到爬取内容');
              }
            };
          } else {
            console.warn('API返回数据中没有outputList字段或为空');
            message.warning('未获取到爬虫数据，请重试');
          }
        } catch (error) {
          console.error('解析爬虫API响应失败:', error);
          console.error('原始数据:', result.data);
          message.error('解析响应失败，请重试');
        }
      } else {
        console.warn('API调用失败:', result);
        message.warning('未获取到爬虫数据，请重试');
      }
    } catch (error) {
      console.error('爬虫模式错误:', error);
      message.error('爬虫数据获取失败，请稍后重试');
    } finally {
      setCrawlLoading(false);
    }
  };

  // 生成爬取文案HTML的函数，使用当前状态中的排序类型
  const generateCrawlResultsHTML = (data, schoolName) => {
    // 根据排序方式对数据进行排序
    let sortedData = [...data];
    
    if (crawlSortType === 'likes') {
      // 按点赞数排序（降序）
      sortedData.sort((a, b) => (b.like_number || 0) - (a.like_number || 0));
    } else if (crawlSortType === 'time') {
      // 按时间排序（降序，最新的在前）
      sortedData.sort((a, b) => {
        const dateA = a.upload_time ? new Date(a.upload_time) : new Date(0);
        const dateB = b.upload_time ? new Date(b.upload_time) : new Date(0);
        return dateB - dateA;
      });
    }
    
    // 保存排序后的数据索引映射，用于"左移"按钮
    window.sortedIndexMap = sortedData.map(item => {
      // 找到原始数据中这个item的索引
      return data.findIndex(original => original === item);
    });
    
    // 遍历排序后的数据生成卡片HTML
    const cardsHTML = sortedData.map((item, index) => {
      // 使用API返回的title字段
      const title = item.title || '无标题';
      
      // 格式化日期
      let dateDisplay = '';
      if (item.upload_time) {
        const dateMatch = item.upload_time.match(/\d{4}-\d{2}-\d{2}/);
        dateDisplay = dateMatch ? dateMatch[0] : item.upload_time;
      }
      
      // 创建卡片式HTML，加入"复制到生成结果区"按钮
      return `
<div style="margin-bottom: 20px; border: 1px solid #e8e8e8; border-radius: 8px; padding: 16px; background-color: #f9f9f9;">
  <div style="display: flex; align-items: center; border-bottom: 1px solid #eaeaea; padding-bottom: 10px; margin-bottom: 15px;">
    <button 
      onclick="window.copyToResults(${index})" 
      style="margin-right: 10px; background-color: #1890ff; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; display: flex; align-items: center;"
    >
      <span style="transform: rotate(180deg); display: inline-block; margin-right: 5px;">➔</span>
      左移
    </button>
    <h3 style="margin: 0; color: #333;">${title}</h3>
  </div>
  
  <div style="white-space: pre-wrap; margin-bottom: 15px;">${item.content}</div>
  
  <div style="color: #666; margin-bottom: 10px;">
    ${item.note_url ? `<div><strong>原文链接</strong>: <a href="${item.note_url}" target="_blank">点击查看原文</a></div>` : ''}
    ${dateDisplay ? `<div><strong>发布时间</strong>: ${dateDisplay}</div>` : ''}
  </div>
  
  <div style="display: flex; gap: 15px; font-size: 0.9em; color: #666;">
    <span>👍 ${item.like_number || 0}</span>
    <span>⭐ ${item.favorite_number || 0}</span>
    <span>💬 ${item.comment_number || 0}</span>
  </div>
</div>
`;
    }).join('\n');
    
    // 返回完整的HTML
    return cardsHTML;
  };
  
  // 新增函数：生成爬取文案HTML，接收排序类型作为参数
  const generateCrawlResultsHTMLWithSort = (data, schoolName, sortType) => {
    // 根据排序方式对数据进行排序
    let sortedData = [...data];
    
    if (sortType === 'likes') {
      // 按点赞数排序（降序）
      sortedData.sort((a, b) => (b.like_number || 0) - (a.like_number || 0));
    } else if (sortType === 'time') {
      // 按时间排序（降序，最新的在前）
      sortedData.sort((a, b) => {
        const dateA = a.upload_time ? new Date(a.upload_time) : new Date(0);
        const dateB = b.upload_time ? new Date(b.upload_time) : new Date(0);
        return dateB - dateA;
      });
    }
    
    // 保存排序后的数据索引映射，用于"左移"按钮
    window.sortedIndexMap = sortedData.map(item => {
      // 找到原始数据中这个item的索引
      return data.findIndex(original => original === item);
    });
    
    // 遍历排序后的数据生成卡片HTML
    const cardsHTML = sortedData.map((item, index) => {
      // 使用API返回的title字段
      const title = item.title || '无标题';
      
      // 格式化日期
      let dateDisplay = '';
      if (item.upload_time) {
        const dateMatch = item.upload_time.match(/\d{4}-\d{2}-\d{2}/);
        dateDisplay = dateMatch ? dateMatch[0] : item.upload_time;
      }
      
      // 创建卡片式HTML，加入"复制到生成结果区"按钮
      return `
<div style="margin-bottom: 20px; border: 1px solid #e8e8e8; border-radius: 8px; padding: 16px; background-color: #f9f9f9;">
  <div style="display: flex; align-items: center; border-bottom: 1px solid #eaeaea; padding-bottom: 10px; margin-bottom: 15px;">
    <button 
      onclick="window.copyToResults(${index})" 
      style="margin-right: 10px; background-color: #1890ff; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; display: flex; align-items: center;"
    >
      <span style="transform: rotate(180deg); display: inline-block; margin-right: 5px;">➔</span>
      左移
    </button>
    <h3 style="margin: 0; color: #333;">${title}</h3>
  </div>
  
  <div style="white-space: pre-wrap; margin-bottom: 15px;">${item.content}</div>
  
  <div style="color: #666; margin-bottom: 10px;">
    ${item.note_url ? `<div><strong>原文链接</strong>: <a href="${item.note_url}" target="_blank">点击查看原文</a></div>` : ''}
    ${dateDisplay ? `<div><strong>发布时间</strong>: ${dateDisplay}</div>` : ''}
  </div>
  
  <div style="display: flex; gap: 15px; font-size: 0.9em; color: #666;">
    <span>👍 ${item.like_number || 0}</span>
    <span>⭐ ${item.favorite_number || 0}</span>
    <span>💬 ${item.comment_number || 0}</span>
  </div>
</div>
`; 
    }).join('\n');
    
    // 返回完整的HTML
    return cardsHTML;
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

  // 清除全部文案
  const handleClearAll = () => {
    Modal.confirm({
      title: '确认清除',
      content: '确定要清除所有生成的文案吗？',
      onOk: () => {
        setContents([]);
        message.success('已清除所有文案');
      }
    });
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

      // 构建符合 Coze API 要求的数据结构
      const cozeRequestData = {
        parameters: {
          title: values.title,
          body: values.body,
          // 如果 Coze workflow 需要其他参数，可以在这里添加
          // images_list: Array.isArray(values.images_list) ? values.images_list : [],
          // school_id: parseInt(values.school_id),
          // tag_id: parseInt(values.tag_id)
        },
        workflow_id: "7498187555692920884"
      };

      console.log('推送 Coze API 数据:', JSON.stringify(cozeRequestData));

      // 使用新的 Coze API 地址
      const apiUrl = 'https://api.coze.cn/v1/workflow/run';
      console.log('使用 Coze API 地址:', apiUrl);

      // 设置请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

      try {
        // 发送 Coze API 推送请求
        const response = await fetch(apiUrl, {
          method: 'POST',
          signal: controller.signal, // 添加超时控制
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // 添加 Coze API 的 Authorization 头
            'Authorization': 'Bearer pat_wBxRH66eSNFjZPp5A9WNMIJg5Ux8JJffhgjkArPPpj2DDdemVvQuVDQbIs47HaGY'
          },
          body: JSON.stringify(cozeRequestData)
        });

        clearTimeout(timeoutId); // 清除超时定时器

        console.log('Coze API 推送响应状态:', response.status);
        const result = await response.json();
        console.log('Coze API 推送响应内容:', result);

        // 处理 Coze API 的响应 (通常 code === 0 表示成功)
        if (result.code === 0) {
          message.success('推送成功 (Coze API)');
          setIsPushModalVisible(false);

          // 显示成功信息 (可以根据 Coze API 返回的具体 data 定制)
          Modal.info({
            title: '推送成功',
            content: (
              <div>
                <p>文案已成功通过 Coze API 推送。</p>
                {result.data && <p>API 返回信息: {JSON.stringify(result.data)}</p>}
                <p>请检查目标系统确认是否已接收。</p>
              </div>
            ),
          });
        } else {
          const errorMessage = result.msg || result.message || `Coze API 错误 (code: ${result.code})`;
          message.error(`推送失败: ${errorMessage}`);

          // 显示详细错误信息
          Modal.error({
            title: '推送失败 (Coze API)',
            content: (
              <div>
                <p>错误信息: {errorMessage}</p>
                <p>状态码: {response.status}</p>
                <p>API Code: {result.code}</p>
                <p>请检查请求参数和网络连接。</p>
              </div>
            ),
          });
        }
      } catch (fetchError) {
        clearTimeout(timeoutId); // 清除超时定时器

        if (fetchError.name === 'AbortError') {
          message.error('请求超时，Coze API 服务器没有响应');
          Modal.error({
            title: '请求超时',
            content: <p>Coze API 服务器在规定时间内没有响应 (15秒)。请检查网络或稍后再试。</p>
          });
        } else {
          // 处理其他网络或解析错误
          message.error(`推送失败: ${fetchError.message || '网络错误或无法连接服务器'}`);
          Modal.error({
            title: '推送失败',
            content: <p>无法连接到 Coze API 服务器或发生其他错误: {fetchError.message}</p>
          });
        }
        console.error('Coze API Fetch Error:', fetchError);
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

  // 处理AI修改按钮点击
  const handleAiModify = async (content) => {
    setAiModifyOriginalContent(content);
    setEditingAiModifyOriginal(content); // 设置可编辑的内容
    setAiModifyResult(''); // 初始化优化结果为空
    setAiLoading(false); // 不显示加载状态
    setAiPrompt('创作小红书文案'); // 设置默认提示词
    
    // 打开弹窗
    setIsAiModifyModalVisible(true);
  };
  
  // 修改确认修改的函数
  const confirmAiModify = async () => {
    // 开始加载
    setAiLoading(true);
    
    try {
      console.log('开始调用AI修改API...');
      console.log('请求参数:', {
        parameters: {
          tiezi: editingAiModifyOriginal,
          prompt: aiPrompt
        },
        workflow_id: '7498182830016544768'
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
            tiezi: editingAiModifyOriginal,
            prompt: aiPrompt
          },
          workflow_id: '7498182830016544768'
        })
      });

      console.log('AI修改API响应状态:', response.status);
      const result = await response.json();
      console.log('AI修改API响应数据:', result);
      
      // 处理 API 响应
      if (result.code === 0 && result.data) {
        try {
          console.log('开始解析AI修改API响应数据:', result.data);
          const data = JSON.parse(result.data);
          console.log('解析后的数据:', data);
          
          if (data.output) {
            // 使用API返回的优化结果，但仅保存结果不应用
            const modifiedContent = data.output;
            setAiModifyResult(modifiedContent);
            message.success('已获取优化结果，请点击"应用并关闭"来应用修改');
          } else {
            console.warn('API返回数据中没有output字段');
            message.warning('未能获取到修改结果，请重试');
          }
        } catch (error) {
          console.error('解析API响应失败:', error);
          console.error('原始数据:', result.data);
          message.error('解析响应失败，请重试');
        }
      } else {
        console.warn('API调用失败:', result);
        message.warning('未能获取到修改结果，请重试');
      }
    } catch (error) {
      console.error('API调用错误:', error);
      message.error('修改失败，请稍后重试');
      // 如果API调用失败，显示简单的修改
      setAiModifyResult(`✨ ${editingAiModifyOriginal.replace(/^🏫|^🎓/, '')}`);
    } finally {
      setAiLoading(false);
    }
  };
  
  // 添加一个新函数用于应用修改并关闭弹窗
  const applyAndCloseModal = () => {
    // 找到当前内容在数组中的索引
    const index = contents.findIndex(item => item === aiModifyOriginalContent);
    if (index !== -1 && aiModifyResult) {
      // 更新内容
      const newContents = [...contents];
      newContents[index] = aiModifyResult;
      setContents(newContents);
      message.success('文案已应用并关闭！');
    }
    
    // 关闭弹窗
    setIsAiModifyModalVisible(false);
  };

  // 添加复制AI优化结果的函数
  const copyAiResult = () => {
    navigator.clipboard.writeText(aiModifyResult);
    message.success('已复制优化结果');
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
            <div>
              <Button
                type="primary"
                size="large"
                onClick={handleGenerate}
                loading={loading}
                className="glow-button"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                autoGML模式
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleCrawl}
                loading={crawlLoading}
                className="glow-button"
                style={{ 
                  marginLeft: '16px',
                  backgroundColor: '#ff4d4f',
                  borderColor: '#ff4d4f'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                爬虫模式
              </Button>
            </div>
          </div>
          
          <div className="content-display">
            <div className="left-section">
              <Card className="content-card" style={{ height: '100%' }}>
                <div className="content-header">
                  <Title level={4} style={{ margin: 0 }}>生成结果</Title>
                  {contents.length > 0 && (
                    <Space>
                      <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleClearAll}
                        className="clear-all-button"
                      >
                        清除全部
                      </Button>
                      <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        onClick={handleCopyAll}
                        className="copy-all-button"
                      >
                        复制全部
                      </Button>
                    </Space>
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
                                <Button
                                  type="primary"
                                  icon={<RobotOutlined />}
                                  onClick={() => handleAiModify(item)}
                                  className="action-button"
                                  style={{ backgroundColor: '#722ED1', borderColor: '#722ED1' }}
                                  loading={aiLoading}
                                >
                                  AI修改
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
                <div className="content-header" style={{ display: 'flex', alignItems: 'center' }}>
                  <Title level={4} style={{ margin: 0 }}>{reportTitle}</Title>
                  <Tooltip 
                    title='若希望根据报告中事件创作小红书文案，请先复制所需事件，然后点击任意"AI修改"按钮，在提示词中输入"创作小红书文案"以及您的其他要求'
                    placement="top"
                  >
                    <QuestionCircleOutlined style={{ color: '#999', cursor: 'pointer', fontSize: '16px', marginLeft: '4px' }} />
                  </Tooltip>
                </div>
                <Divider />
                <div className="right-content">
                  {apiInfo && apiInfo.report ? (
                    <div className="report-content">
                      {reportTitle === '爬取文案展示' ? (
                        <>
                          {/* 添加排序控件 */}
                          <div style={{ display: 'flex', marginBottom: '20px', backgroundColor: '#f0f2f5', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 'bold', marginRight: '10px', display: 'flex', alignItems: 'center' }}>排序方式:</div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <Button
                                type={crawlSortType === 'default' ? 'primary' : 'default'}
                                onClick={() => {
                                  // 直接使用新的排序类型值而不依赖状态更新
                                  const newSortType = 'default';
                                  setCrawlSortType(newSortType);
                                  if (crawlResults.length > 0) {
                                    // 生成HTML时使用新的排序类型，而不是状态
                                    const newHTML = generateCrawlResultsHTMLWithSort(crawlResults, school, newSortType);
                                    setApiInfo(prev => ({
                                      ...prev,
                                      report: newHTML
                                    }));
                                  }
                                }}
                              >
                                默认
                              </Button>
                              <Button
                                type={crawlSortType === 'likes' ? 'primary' : 'default'}
                                onClick={() => {
                                  // 直接使用新的排序类型值而不依赖状态更新
                                  const newSortType = 'likes';
                                  setCrawlSortType(newSortType);
                                  if (crawlResults.length > 0) {
                                    // 生成HTML时使用新的排序类型，而不是状态
                                    const newHTML = generateCrawlResultsHTMLWithSort(crawlResults, school, newSortType);
                                    setApiInfo(prev => ({
                                      ...prev,
                                      report: newHTML
                                    }));
                                  }
                                }}
                                icon={<LikeOutlined />}
                              >
                                按热度排序
                              </Button>
                              <Button
                                type={crawlSortType === 'time' ? 'primary' : 'default'}
                                onClick={() => {
                                  // 直接使用新的排序类型值而不依赖状态更新
                                  const newSortType = 'time';
                                  setCrawlSortType(newSortType);
                                  if (crawlResults.length > 0) {
                                    // 生成HTML时使用新的排序类型，而不是状态
                                    const newHTML = generateCrawlResultsHTMLWithSort(crawlResults, school, newSortType);
                                    setApiInfo(prev => ({
                                      ...prev,
                                      report: newHTML
                                    }));
                                  }
                                }}
                              >
                                按时间排序 🕒
                              </Button>
                            </div>
                          </div>
                          <div dangerouslySetInnerHTML={{ __html: apiInfo.report }} />
                        </>
                      ) : (
                        <ReactMarkdown
                          components={{
                            // 自定义链接渲染，在新标签页打开
                            a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                          }}
                        >
                          {apiInfo.report}
                        </ReactMarkdown>
                      )}
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

      {/* AI修改弹窗 */}
      <Modal
        title="AI文案优化"
        open={isAiModifyModalVisible}
        onCancel={() => setIsAiModifyModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsAiModifyModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={confirmAiModify}
            disabled={aiLoading}
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
          >
            确认优化
          </Button>,
          <Button 
            key="apply" 
            type="primary" 
            onClick={applyAndCloseModal}
            disabled={!aiModifyResult || aiLoading}
            style={{ backgroundColor: '#722ED1', borderColor: '#722ED1' }}
          >
            应用并关闭
          </Button>,
        ]}
        width={700}
      >
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>原文：</div>
          <Input.TextArea
            value={editingAiModifyOriginal}
            onChange={(e) => setEditingAiModifyOriginal(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
            style={{ marginBottom: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>提示词：</div>
          <Input.TextArea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 4 }}
            style={{ marginBottom: '8px' }}
          />
        </div>
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold' }}>优化结果：</div>
            {!aiLoading && (
              <Button 
                type="text" 
                icon={<CopyOutlined />} 
                onClick={copyAiResult}
                size="small"
              >
                复制
              </Button>
            )}
          </div>
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ marginBottom: '10px' }}>AI正在优化中...</div>
            </div>
          ) : (
            <div style={{ 
              padding: '12px', 
              background: '#f0f5ff', 
              borderRadius: '4px',
              border: '1px solid #d6e4ff',
              whiteSpace: 'pre-wrap' 
            }}>
              {aiModifyResult}
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
}

export default App; 